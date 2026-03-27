<script setup lang="ts">
defineProps<{
  canUseVoice: boolean
  connectionState: 'disconnected' | 'connecting' | 'connected'
  isMuted: boolean
  permissionState: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  error?: string
}>()

const emit = defineEmits<{
  join: []
  leave: []
  toggleMute: []
}>()
</script>

<template>
  <div class="rounded-[1.4rem] border border-white/10 bg-slate-950/82 p-3 text-white shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur-xl">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-300/80">Room Voice</p>
        <p class="mt-1 text-sm font-semibold text-slate-100">
          <span v-if="connectionState === 'connected'">Connected</span>
          <span v-else-if="connectionState === 'connecting'">Connecting…</span>
          <span v-else>Not joined</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="connectionState !== 'connected'"
          type="button"
          class="inline-flex min-h-9 items-center justify-center rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canUseVoice || connectionState === 'connecting'"
          @click="emit('join')"
        >
          Join Voice
        </button>
        <template v-else>
          <button
            type="button"
            class="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            @click="emit('toggleMute')"
          >
            {{ isMuted ? 'Unmute' : 'Mute' }}
          </button>
          <button
            type="button"
            class="inline-flex min-h-9 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-500/12 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/18"
            @click="emit('leave')"
          >
            Leave
          </button>
        </template>
      </div>
    </div>
    <p v-if="permissionState === 'denied'" class="mt-2 text-xs text-rose-200/90">
      Microphone permission is blocked for this browser session.
    </p>
    <p v-else-if="permissionState === 'unsupported'" class="mt-2 text-xs text-rose-200/90">
      Voice chat is not supported in this browser.
    </p>
    <p v-if="error" class="mt-2 text-xs text-rose-200/90">
      {{ error }}
    </p>
  </div>
</template>
