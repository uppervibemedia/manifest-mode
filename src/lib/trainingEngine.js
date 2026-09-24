export const FOCUS_SECONDS = 30;
export const MEMORY_ROUNDS = 5;
export function makePattern(size, random = Math.random) {
  const cells = Array.from({ length: 9 }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, Math.min(9, Math.max(0, size)));
}
export function focusScore(hits, mistakes) {
  return Math.max(0, Math.min(100, hits * 5 - mistakes * 3));
}
export function memoryScore(correct, total) {
  return total > 0 ? Math.round(100 * Math.max(0, Math.min(correct, total)) / total) : 0;
}
export function trainingXP(score) {
  return 10 + Math.round(Math.max(0, Math.min(100, score)) * 0.4);
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
