/** Etiqueta para registros sin username persistido (legacy). */
export const LEGACY_UNKNOWN_USERNAME = 'Desconocido';

export function formatOwnershipUsername(username: string | null | undefined): string {
  const trimmed = username?.trim();
  return trimmed ? trimmed : LEGACY_UNKNOWN_USERNAME;
}
