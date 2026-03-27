import { getVoiceEligibleParticipant } from './game-record.service';

type VoiceSocket = {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  to: (room: string) => {
    emit: (event: string, ...args: unknown[]) => void;
  };
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  data: {
    voiceMemberships?: Set<string>;
  };
};

type VoiceIo = {
  to: (room: string) => {
    emit: (event: string, ...args: unknown[]) => void;
  };
  of: (namespace: string) => {
    on: (event: 'connection', handler: (socket: VoiceSocket) => void) => void;
  };
};

type VoiceParticipant = {
  userId: string;
  displayName: string;
  playerId: string;
  socketId: string;
  muted: boolean;
  speaking: boolean;
};

type VoiceRoomState = Map<string, VoiceParticipant>;

const VOICE_ROOM_PREFIX = 'voice:';
const voiceRooms = new Map<string, VoiceRoomState>();

function getVoiceRoomName(matchID: string) {
  return `${VOICE_ROOM_PREFIX}${matchID}`;
}

function listParticipants(matchID: string) {
  const room = voiceRooms.get(matchID);
  if (!room) return [];
  return Array.from(room.values()).map(({ socketId: _socketId, ...participant }) => participant);
}

function getOrCreateRoom(matchID: string) {
  const existing = voiceRooms.get(matchID);
  if (existing) return existing;
  const nextRoom: VoiceRoomState = new Map();
  voiceRooms.set(matchID, nextRoom);
  return nextRoom;
}

function removeParticipant(matchID: string, userID: string) {
  const room = voiceRooms.get(matchID);
  if (!room) return;
  if (!room.delete(userID)) return;
  if (room.size === 0) {
    voiceRooms.delete(matchID);
  }
}

function withAck(ack: unknown, payload: unknown) {
  if (typeof ack === 'function') {
    (ack as (value: unknown) => void)(payload);
  }
}

function findTargetSocket(matchID: string, targetUserId: string) {
  return voiceRooms.get(matchID)?.get(targetUserId)?.socketId ?? null;
}

function forwardSignal(
  io: VoiceIo,
  socket: VoiceSocket,
  eventName: string,
  payload: { matchId?: string; targetUserId?: string; fromUserId?: string } & Record<string, unknown>,
) {
  const matchID = typeof payload.matchId === 'string' ? payload.matchId : '';
  const targetUserId = typeof payload.targetUserId === 'string' ? payload.targetUserId : '';
  const fromUserId = typeof payload.fromUserId === 'string' ? payload.fromUserId : '';
  if (!matchID || !targetUserId || !fromUserId) return;

  const sourceParticipant = voiceRooms.get(matchID)?.get(fromUserId);
  if (!sourceParticipant || sourceParticipant.socketId !== socket.id) return;

  const targetSocketId = findTargetSocket(matchID, targetUserId);
  if (!targetSocketId) return;

  io.to(targetSocketId).emit(eventName, payload);
}

export function registerVoiceSignaling(io: VoiceIo) {
  io.of('sevens').on('connection', (socket: VoiceSocket) => {
    socket.data.voiceMemberships ??= new Set();

    socket.on('voice:join', async (payload: { matchId?: string; userId?: string }, ack?: unknown) => {
      const matchID = typeof payload?.matchId === 'string' ? payload.matchId : '';
      const userID = typeof payload?.userId === 'string' ? payload.userId : '';
      if (!matchID || !userID) {
        return withAck(ack, { ok: false, error: 'Missing voice room details.' });
      }

      const eligibleParticipant = await getVoiceEligibleParticipant(matchID, userID);
      if (!eligibleParticipant) {
        return withAck(ack, { ok: false, error: 'You are not allowed to join voice for this room.' });
      }

      const room = getOrCreateRoom(matchID);
      const existingParticipants = listParticipants(matchID).filter((participant) => participant.userId !== userID);

      room.set(userID, {
        userId: userID,
        displayName: eligibleParticipant.displayName,
        playerId: eligibleParticipant.playerId,
        socketId: socket.id,
        muted: false,
        speaking: false,
      });

      socket.join(getVoiceRoomName(matchID));
      socket.data.voiceMemberships?.add(matchID);

      withAck(ack, {
        ok: true,
        participants: existingParticipants,
        self: {
          userId: userID,
          displayName: eligibleParticipant.displayName,
          playerId: eligibleParticipant.playerId,
          muted: false,
          speaking: false,
        },
      });

      socket.to(getVoiceRoomName(matchID)).emit('voice:participant-joined', {
        userId: userID,
        displayName: eligibleParticipant.displayName,
        playerId: eligibleParticipant.playerId,
        muted: false,
        speaking: false,
      });
    });

    socket.on('voice:leave', (payload: { matchId?: string; userId?: string }) => {
      const matchID = typeof payload?.matchId === 'string' ? payload.matchId : '';
      const userID = typeof payload?.userId === 'string' ? payload.userId : '';
      if (!matchID || !userID) return;

      removeParticipant(matchID, userID);
      socket.leave(getVoiceRoomName(matchID));
      socket.data.voiceMemberships?.delete(matchID);

      socket.to(getVoiceRoomName(matchID)).emit('voice:participant-left', {
        userId: userID,
      });
    });

    socket.on('voice:mute', (payload: { matchId?: string; userId?: string; muted?: boolean }) => {
      const matchID = typeof payload?.matchId === 'string' ? payload.matchId : '';
      const userID = typeof payload?.userId === 'string' ? payload.userId : '';
      if (!matchID || !userID) return;

      const participant = voiceRooms.get(matchID)?.get(userID);
      if (!participant || participant.socketId !== socket.id) return;

      participant.muted = Boolean(payload.muted);
      io.to(getVoiceRoomName(matchID)).emit('voice:mute-updated', {
        userId,
        muted: participant.muted,
      });
    });

    socket.on('voice:speaking', (payload: { matchId?: string; userId?: string; speaking?: boolean }) => {
      const matchID = typeof payload?.matchId === 'string' ? payload.matchId : '';
      const userID = typeof payload?.userId === 'string' ? payload.userId : '';
      if (!matchID || !userID) return;

      const participant = voiceRooms.get(matchID)?.get(userID);
      if (!participant || participant.socketId !== socket.id) return;

      participant.speaking = Boolean(payload.speaking);
      socket.to(getVoiceRoomName(matchID)).emit('voice:speaking-updated', {
        userId,
        speaking: participant.speaking,
      });
    });

    socket.on('voice:offer', (payload: Record<string, unknown>) => {
      forwardSignal(io, socket, 'voice:offer', payload as { matchId?: string; targetUserId?: string; fromUserId?: string } & Record<string, unknown>);
    });

    socket.on('voice:answer', (payload: Record<string, unknown>) => {
      forwardSignal(io, socket, 'voice:answer', payload as { matchId?: string; targetUserId?: string; fromUserId?: string } & Record<string, unknown>);
    });

    socket.on('voice:ice', (payload: Record<string, unknown>) => {
      forwardSignal(io, socket, 'voice:ice', payload as { matchId?: string; targetUserId?: string; fromUserId?: string } & Record<string, unknown>);
    });

    socket.on('disconnect', () => {
      const memberships = Array.from(socket.data.voiceMemberships ?? []);
      for (const matchID of memberships) {
        const room = voiceRooms.get(matchID);
        if (!room) continue;
        const participant = Array.from(room.values()).find((entry) => entry.socketId === socket.id);
        if (!participant) continue;

        removeParticipant(matchID, participant.userId);
        socket.to(getVoiceRoomName(matchID)).emit('voice:participant-left', {
          userId: participant.userId,
        });
      }
      socket.data.voiceMemberships?.clear();
    });
  });
}
