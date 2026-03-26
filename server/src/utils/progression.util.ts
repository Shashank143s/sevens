export function getLevelFromXp(xpTotal: number) {
  const safeXp = Math.max(0, Math.floor(xpTotal));
  let level = 1;
  let remainingXp = safeXp;
  let threshold = 100;

  while (remainingXp >= threshold) {
    remainingXp -= threshold;
    level += 1;
    threshold += 50;
  }

  return level;
}
