export function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? 'Player';
  const lastName = parts.slice(1).join(' ') || 'Unknown';
  return { firstName, lastName };
}
