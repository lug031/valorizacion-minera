import { INTER_SOURCE_LABELS } from '../../domain/constants/inter-metadata';
import type { InterSyncMetadata } from '../store/settings-store';
import { formatPeruDateTime } from '../../utils/peru-datetime';

export type InterHintMode = 'synced_detail';

export interface InterMetalHint {
  mode: InterHintMode;
  title: string;
  valueLine: string;
  detailLine: string | null;
}

function formatTimestamp(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  return formatPeruDateTime(iso);
}

function sourceLabel(source: string | null | undefined): string | null {
  if (!source?.trim()) return null;
  return INTER_SOURCE_LABELS[source] ?? source;
}

function isExternalInterSource(source: string | null | undefined): boolean {
  return Boolean(source?.trim() && source !== 'reference' && source !== 'manual');
}

/** Metadata INTER válida a nivel global (mostrar bloques de referencia sincronizada). */
export function hasValidInterSyncMetadata(meta: InterSyncMetadata): boolean {
  if (meta.interFetchStatus === 'ok') return true;
  if (meta.interGoldFetchedAt?.trim() || meta.interSilverFetchedAt?.trim()) return true;
  if (isExternalInterSource(meta.interGoldSource) || isExternalInterSource(meta.interSilverSource)) {
    return true;
  }
  return false;
}

/** Metadata INTER válida para un metal (hint en cotización). */
export function hasValidInterMetalMetadata(
  meta: InterSyncMetadata,
  metal: 'gold' | 'silver'
): boolean {
  if (!hasValidInterSyncMetadata(meta)) return false;

  const fetchedAt = metal === 'gold' ? meta.interGoldFetchedAt : meta.interSilverFetchedAt;
  const source = metal === 'gold' ? meta.interGoldSource : meta.interSilverSource;

  if (fetchedAt?.trim()) return true;
  if (isExternalInterSource(source)) return true;
  if (meta.interFetchStatus === 'ok') return true;
  return false;
}

export function buildInterMetalHint(
  metal: 'gold' | 'silver',
  syncedValue: string,
  meta: InterSyncMetadata,
  lastSyncAt: string | null
): InterMetalHint | null {
  if (!hasValidInterMetalMetadata(meta, metal)) return null;

  const fetchedAt = metal === 'gold' ? meta.interGoldFetchedAt : meta.interSilverFetchedAt;
  const source = metal === 'gold' ? meta.interGoldSource : meta.interSilverSource;
  const when = formatTimestamp(fetchedAt) ?? formatTimestamp(lastSyncAt);
  const src = sourceLabel(source);
  const parts = [src, when ? `· ${when}` : null].filter(Boolean);

  return {
    mode: 'synced_detail',
    title: 'Último valor sincronizado',
    valueLine: `US$ ${syncedValue}`,
    detailLine: parts.length ? parts.join(' ') : null,
  };
}

export function buildInterFetchStatusHint(meta: InterSyncMetadata): string | null {
  if (!hasValidInterSyncMetadata(meta)) return null;
  if (meta.interFetchStatus !== 'failed' || !meta.interFetchError?.trim()) {
    return null;
  }
  return `Última actualización automática en web falló: ${meta.interFetchError}`;
}
