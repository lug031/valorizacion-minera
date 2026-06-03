export function formatUsageDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
  }
  return `${minutes} min`;
}
