import type { LobbyPresenceJoinPayload, LobbyPresenceUser } from '../../../shared/types';

type PresenceRecord = LobbyPresenceUser & {
  socketIds: Set<string>;
  joinedAtMs: number;
  lastSeenAtMs: number;
};

const presenceByUserId = new Map<string, PresenceRecord>();
const userIdBySocketId = new Map<string, string>();

function toSafePresenceValue(value?: string | null) {
  return String(value ?? '').trim();
}

function toSnapshot(record: PresenceRecord): LobbyPresenceUser {
  return {
    userId: record.userId,
    name: record.name,
    socketCount: record.socketIds.size,
    joinedAt: new Date(record.joinedAtMs).toISOString(),
    lastSeenAt: new Date(record.lastSeenAtMs).toISOString(),
  };
}

function getOrCreateRecord(userId: string, name: string) {
  const existing = presenceByUserId.get(userId);
  if (existing) {
    existing.name = name || existing.name;
    existing.lastSeenAtMs = Date.now();
    return existing;
  }

  const now = Date.now();
  const record: PresenceRecord = {
    userId,
    name,
    socketCount: 0,
    joinedAt: new Date(now).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
    joinedAtMs: now,
    lastSeenAtMs: now,
    socketIds: new Set<string>(),
  };
  presenceByUserId.set(userId, record);
  return record;
}

export function upsertLobbyPresence(socketId: string, payload: LobbyPresenceJoinPayload) {
  const userId = toSafePresenceValue(payload.userId);
  const name = toSafePresenceValue(payload.name);
  if (!userId || !name) return null;

  const previousUserId = userIdBySocketId.get(socketId);
  if (previousUserId && previousUserId !== userId) {
    removeLobbyPresence(socketId);
  }

  const record = getOrCreateRecord(userId, name);
  record.name = name;
  record.lastSeenAtMs = Date.now();
  record.socketIds.add(socketId);
  userIdBySocketId.set(socketId, userId);
  return toSnapshot(record);
}

export function removeLobbyPresence(socketId: string) {
  const userId = userIdBySocketId.get(socketId);
  if (!userId) return null;

  userIdBySocketId.delete(socketId);
  const record = presenceByUserId.get(userId);
  if (!record) return null;

  record.socketIds.delete(socketId);
  record.lastSeenAtMs = Date.now();

  if (record.socketIds.size > 0) {
    return toSnapshot(record);
  }

  presenceByUserId.delete(userId);
  return null;
}

export function listLobbyPresence() {
  return [...presenceByUserId.values()]
    .map(toSnapshot)
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
}

export function getLobbyPresenceCount() {
  return presenceByUserId.size;
}

export function clearLobbyPresenceForTests() {
  presenceByUserId.clear();
  userIdBySocketId.clear();
}
