/** Compara valores comerciales para estado visual sugerido vs manual. */
export function valuesMatchCommercial(
  current: string | undefined | null,
  suggested: string | null | undefined
): boolean {
  if (suggested == null || suggested === '') return false;
  const cur = String(current ?? '').trim().replace(',', '.');
  const sug = String(suggested).trim().replace(',', '.');
  if (cur === '' || sug === '') return false;
  const nc = parseFloat(cur);
  const ns = parseFloat(sug);
  if (!Number.isNaN(nc) && !Number.isNaN(ns)) return nc === ns;
  return cur === sug;
}

export function formatMaquilaSuggestionLabel(leyOzTc: string, suggested: string): string {
  const ley = leyOzTc.trim() || '—';
  return `Sugerido según ley ${ley} oz/tc: ${suggested}`;
}

export function formatRcGoldSuggestionLabel(suggested: string): string {
  return `RC sugerido: ${suggested}`;
}
