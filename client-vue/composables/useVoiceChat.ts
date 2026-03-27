import { computed, onUnmounted, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { io, type Socket } from 'socket.io-client'

type VoicePermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
type VoiceConnectionState = 'disconnected' | 'connecting' | 'connected'

export interface VoiceParticipant {
  userId: string
  displayName: string
  playerId: string
  muted: boolean
  speaking: boolean
  connected: boolean
}

type VoiceSignalParticipant = Omit<VoiceParticipant, 'connected'>

type UseVoiceChatOptions = {
  matchId: MaybeRefOrGetter<string>
  userId: MaybeRefOrGetter<string | null | undefined>
  displayName: MaybeRefOrGetter<string | null | undefined>
}

export function useVoiceChat(options: UseVoiceChatOptions) {
  const config = useRuntimeConfig()

  const permissionState = ref<VoicePermissionState>('idle')
  const connectionState = ref<VoiceConnectionState>('disconnected')
  const participants = ref<VoiceParticipant[]>([])
  const isMuted = ref(false)
  const isSpeaking = ref(false)
  const error = ref('')

  let socket: Socket | null = null
  let handlersBound = false
  let localStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let speakingInterval: ReturnType<typeof setInterval> | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null

  const peers = new Map<string, RTCPeerConnection>()
  const remoteAudio = new Map<string, HTMLAudioElement>()

  const matchId = computed(() => toValue(options.matchId))
  const userId = computed(() => toValue(options.userId) ?? '')
  const displayName = computed(() => toValue(options.displayName) ?? '')
  const canUseVoice = computed(() => import.meta.client && typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  const isJoined = computed(() => connectionState.value === 'connected')

  function getIceServers() {
    const raw = config.public.voiceIceServers
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as RTCIceServer[]
        if (Array.isArray(parsed) && parsed.length) {
          return parsed
        }
      } catch {
        // fall through to default STUN
      }
    }
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }

  function upsertParticipant(participant: Partial<VoiceParticipant> & Pick<VoiceParticipant, 'userId'>) {
    const existing = participants.value.find((entry) => entry.userId === participant.userId)
    if (existing) {
      Object.assign(existing, participant)
      participants.value = [...participants.value]
      return
    }

    participants.value = [
      ...participants.value,
      {
        displayName: participant.displayName ?? 'Player',
        playerId: participant.playerId ?? '',
        muted: participant.muted ?? false,
        speaking: participant.speaking ?? false,
        connected: participant.connected ?? participant.userId === userId.value,
        userId: participant.userId,
      },
    ]
  }

  function removeParticipant(targetUserId: string) {
    participants.value = participants.value.filter((participant) => participant.userId !== targetUserId)
  }

  function cleanupPeer(targetUserId: string) {
    peers.get(targetUserId)?.close()
    peers.delete(targetUserId)

    const audio = remoteAudio.get(targetUserId)
    if (audio) {
      audio.pause()
      audio.srcObject = null
    }
    remoteAudio.delete(targetUserId)
  }

  function cleanupRemotePeers() {
    for (const targetUserId of peers.keys()) {
      cleanupPeer(targetUserId)
    }
  }

  function cleanupLocalMedia() {
    if (speakingInterval) {
      clearInterval(speakingInterval)
      speakingInterval = null
    }

    sourceNode?.disconnect()
    sourceNode = null
    analyser?.disconnect()
    analyser = null

    if (audioContext) {
      void audioContext.close().catch(() => {})
      audioContext = null
    }

    localStream?.getTracks().forEach(track => track.stop())
    localStream = null
    isMuted.value = false
    isSpeaking.value = false
  }

  function disconnectSocket() {
    if (socket) {
      socket.disconnect()
      socket = null
      handlersBound = false
    }
  }

  function resetVoiceState() {
    participants.value = []
    error.value = ''
    connectionState.value = 'disconnected'
  }

  function createRemoteAudio(targetUserId: string, stream: MediaStream) {
    const existing = remoteAudio.get(targetUserId)
    if (existing) {
      existing.srcObject = stream
      return
    }

    const audio = new Audio()
    audio.autoplay = true
    audio.playsInline = true
    audio.srcObject = stream
    remoteAudio.set(targetUserId, audio)
    void audio.play().catch(() => {})
  }

  async function emitSpeakingState(nextSpeaking: boolean) {
    if (!socket || !isJoined.value) return
    socket.emit('voice:speaking', {
      matchId: matchId.value,
      userId: userId.value,
      speaking: nextSpeaking && !isMuted.value,
    })
  }

  function startSpeakingDetection() {
    if (!import.meta.client || !localStream) return
    if (speakingInterval) clearInterval(speakingInterval)

    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    audioContext = new AudioContextCtor()
    sourceNode = audioContext.createMediaStreamSource(localStream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    sourceNode.connect(analyser)

    const samples = new Uint8Array(analyser.frequencyBinCount)

    speakingInterval = setInterval(() => {
      if (!analyser) return
      analyser.getByteFrequencyData(samples)
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length
      const nextSpeaking = average > 18 && !isMuted.value
      if (nextSpeaking === isSpeaking.value) return
      isSpeaking.value = nextSpeaking
      void emitSpeakingState(nextSpeaking)
      upsertParticipant({
        userId: userId.value,
        speaking: nextSpeaking,
      })
    }, 250)
  }

  function getOrCreatePeer(targetUserId: string) {
    const existing = peers.get(targetUserId)
    if (existing) return existing

    const peer = new RTCPeerConnection({
      iceServers: getIceServers(),
    })

    if (localStream) {
      localStream.getTracks().forEach(track => peer.addTrack(track, localStream as MediaStream))
    }

    peer.onicecandidate = (event) => {
      if (!event.candidate || !socket) return
      socket.emit('voice:ice', {
        matchId: matchId.value,
        fromUserId: userId.value,
        targetUserId,
        candidate: event.candidate,
      })
    }

    peer.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) createRemoteAudio(targetUserId, stream)
    }

    peer.onconnectionstatechange = () => {
      const connected = peer.connectionState === 'connected' || peer.connectionState === 'completed'
      upsertParticipant({
        userId: targetUserId,
        connected,
      })

      if (peer.connectionState === 'failed' || peer.connectionState === 'closed' || peer.connectionState === 'disconnected') {
        upsertParticipant({
          userId: targetUserId,
          connected: false,
        })
      }
    }

    peers.set(targetUserId, peer)
    return peer
  }

  async function createOfferFor(targetUserId: string) {
    if (!socket) return
    const peer = getOrCreatePeer(targetUserId)
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    socket.emit('voice:offer', {
      matchId: matchId.value,
      fromUserId: userId.value,
      targetUserId,
      sdp: offer,
    })
  }

  function bindSocketHandlers() {
    if (!socket || handlersBound) return
    handlersBound = true

    socket.on('voice:participant-joined', (participant: VoiceSignalParticipant) => {
      upsertParticipant({
        ...participant,
        connected: participant.userId === userId.value,
      })
    })

    socket.on('voice:participant-left', (payload: { userId: string }) => {
      cleanupPeer(payload.userId)
      removeParticipant(payload.userId)
    })

    socket.on('voice:mute-updated', (payload: { userId: string; muted: boolean }) => {
      upsertParticipant({
        userId: payload.userId,
        muted: payload.muted,
      })
    })

    socket.on('voice:speaking-updated', (payload: { userId: string; speaking: boolean }) => {
      upsertParticipant({
        userId: payload.userId,
        speaking: payload.speaking,
      })
    })

    socket.on('voice:offer', async (payload: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const peer = getOrCreatePeer(payload.fromUserId)
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        socket?.emit('voice:answer', {
          matchId: matchId.value,
          fromUserId: userId.value,
          targetUserId: payload.fromUserId,
          sdp: answer,
        })
      } catch (cause) {
        console.error('[voice] offer handling failed', cause)
      }
    })

    socket.on('voice:answer', async (payload: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const peer = peers.get(payload.fromUserId)
        if (!peer) return
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      } catch (cause) {
        console.error('[voice] answer handling failed', cause)
      }
    })

    socket.on('voice:ice', async (payload: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      try {
        const peer = getOrCreatePeer(payload.fromUserId)
        await peer.addIceCandidate(new RTCIceCandidate(payload.candidate))
      } catch (cause) {
        console.error('[voice] ice handling failed', cause)
      }
    })
  }

  async function ensureLocalStream() {
    if (!import.meta.client) {
      permissionState.value = 'unsupported'
      throw new Error('Voice chat is only available in the browser.')
    }

    if (!canUseVoice.value) {
      permissionState.value = 'unsupported'
      throw new Error('This browser does not support microphone access.')
    }

    if (localStream) return localStream

    permissionState.value = 'requesting'
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      permissionState.value = 'granted'
      startSpeakingDetection()
      return localStream
    } catch {
      permissionState.value = 'denied'
      throw new Error('Microphone permission was denied.')
    }
  }

  async function joinVoice() {
    error.value = ''
    if (!userId.value || !matchId.value) {
      error.value = 'Voice chat is unavailable until the room is fully joined.'
      return
    }

    if (isJoined.value) return

    try {
      connectionState.value = 'connecting'
      await ensureLocalStream()

      socket = io(`${config.public.socketServer}/sevens`, {
        transports: ['websocket', 'polling'],
      })

      bindSocketHandlers()

      const response = await new Promise<{ ok: boolean; error?: string; participants?: VoiceSignalParticipant[]; self?: VoiceSignalParticipant }>((resolve) => {
        socket?.emit('voice:join', {
          matchId: matchId.value,
          userId: userId.value,
        }, resolve)
      })

      if (!response.ok) {
        disconnectSocket()
        connectionState.value = 'disconnected'
        error.value = response.error ?? 'Unable to join voice chat.'
        return
      }

      participants.value = []
      if (response.self) {
        upsertParticipant({
          ...response.self,
          connected: true,
        })
      } else {
        upsertParticipant({
          userId: userId.value,
          displayName: displayName.value || 'You',
          playerId: '',
          muted: false,
          speaking: false,
          connected: true,
        })
      }

      for (const participant of response.participants ?? []) {
        upsertParticipant({
          ...participant,
          connected: false,
        })
      }

      connectionState.value = 'connected'

      for (const participant of response.participants ?? []) {
        await createOfferFor(participant.userId)
      }
    } catch (cause) {
      console.error('[voice] join failed', cause)
      error.value = cause instanceof Error ? cause.message : 'Unable to join voice chat.'
      connectionState.value = 'disconnected'
      cleanupRemotePeers()
      cleanupLocalMedia()
      disconnectSocket()
    }
  }

  async function leaveVoice() {
    if (socket && userId.value && matchId.value) {
      socket.emit('voice:leave', {
        matchId: matchId.value,
        userId: userId.value,
      })
    }
    cleanupRemotePeers()
    cleanupLocalMedia()
    disconnectSocket()
    resetVoiceState()
  }

  async function toggleMute() {
    if (!localStream || !isJoined.value) return
    isMuted.value = !isMuted.value
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted.value
    })
    upsertParticipant({
      userId: userId.value,
      muted: isMuted.value,
      speaking: isMuted.value ? false : isSpeaking.value,
    })
    socket?.emit('voice:mute', {
      matchId: matchId.value,
      userId: userId.value,
      muted: isMuted.value,
    })

    if (isMuted.value && isSpeaking.value) {
      isSpeaking.value = false
      await emitSpeakingState(false)
    }
  }

  watch(() => matchId.value, async (nextMatchId, previousMatchId) => {
    if (!previousMatchId || previousMatchId === nextMatchId) return
    await leaveVoice()
  })

  onUnmounted(() => {
    void leaveVoice()
  })

  return {
    canUseVoice,
    connectionState,
    error,
    isJoined,
    isMuted,
    isSpeaking,
    joinVoice,
    leaveVoice,
    participants,
    permissionState,
    toggleMute,
  }
}
