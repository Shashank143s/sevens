export function normalizeRoomName(roomName?: string) {
  return roomName?.trim() ?? '';
}

export function validateRoomName(roomName?: string) {
  const normalizedName = normalizeRoomName(roomName);
  if (normalizedName.length < 3) {
    throw new Error('Room name must be at least 3 characters.');
  }
  if (normalizedName.length > 40) {
    throw new Error('Room name must be 40 characters or fewer.');
  }
  return normalizedName;
}
