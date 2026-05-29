/**
 * Formato: VAL-YYYYMMDD-HHmmss-XXXX
 * Ejemplo: VAL-20260524-213015-A8F2
 */
export function generateValuationCode(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());
  const ss = pad2(now.getSeconds());
  const suffix = randomHex4();
  return `VAL-${y}${m}${d}-${hh}${mm}${ss}-${suffix}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function randomHex4(): string {
  const bytes = new Uint8Array(2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 256);
    bytes[1] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}
