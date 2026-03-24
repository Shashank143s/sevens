import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

function deriveKey(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

export function normalizeRoomPassword(password?: string) {
  return password?.trim() ?? '';
}

export function hashRoomPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${deriveKey(password, salt)}`;
}

export function verifyRoomPassword(password: string, hash: string) {
  const [salt, storedKey] = hash.split(':');
  if (!salt || !storedKey) return false;
  const passwordKey = deriveKey(password, salt);
  return timingSafeEqual(Buffer.from(passwordKey, 'hex'), Buffer.from(storedKey, 'hex'));
}
