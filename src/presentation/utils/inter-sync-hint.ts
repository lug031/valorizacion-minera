import { INTER_SOURCE_LABELS } from '../../domain/constants/inter-metadata';
import type { InterSyncMetadata } from '../store/settings-store';

export type InterHintMode = 'synced_detail' | 'offline_cached' | 'none';

export interface InterMetalHint {
  mode: InterHintMode;
  title: string;
  valueLine: string;
  detailLine: string | null;
}

function formatTimestamp(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  try {
    return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function sourceLabel(source: string | null | undefined): string | null {
  if (!source?.trim()) return null;
  return INTER_SOURCE_LABELS[source] ?? source;
}

function hasAutoFetchMetadata(meta: InterSyncMetadata, metal: 'gold' | 'silver'): boolean {
  const fetchedAt = metal === 'gold' ? meta.interGoldFetchedAt : meta.interSilverFetchedAt;
  const source = metal === 'gold' ? meta.interGoldSource : meta.interSilverSource;
  if (fetchedAt?.trim()) return true;
  if (source && source !== 'reference' && source !== 'manual') return true;
  return meta.interFetchStatus === 'ok';
}

export function buildInterMetalHint(
  metal: 'gold' | 'silver',
  syncedValue: string,
  meta: InterSyncMetadata,
  lastSyncAt: string | null
): InterMetalHint | null {
  const fetchedAt = metal === 'gold' ? meta.interGoldFetchedAt : meta.interSilverFetchedAt;
  const source = metal === 'gold' ? meta.interGoldSource : meta.interSilverSource;
  const valueLine = `US$ ${syncedValue}`;

  if (hasAutoFetchMetadata(meta, metal)) {
    const when = formatTimestamp(fetchedAt) ?? formatTimestamp(lastSyncAt);
    const src = sourceLabel(source);
    const parts = [src, when ? `· ${when}` : null].filter(Boolean);
    return {
      mode: 'synced_detail',
      title: 'Último valor sincronizado',
      valueLine,
      detailLine: parts.length ? parts.join(' ') : null,
    };
  }

  if (lastSyncAt?.trim()) {
    const when = formatTimestamp(lastSyncAt);
    const src = sourceLabel(source);
    const parts = [src, when ? `· sync ${when}` : null].filter(Boolean);
    return {
      mode: 'offline_cached',
      title: 'Usando último valor sincronizado',
      valueLine,
      detailLine: parts.length ? parts.join(' ') : null,
    };
  }

  return null;
}

export function buildInterFetchStatusHint(meta: InterSyncMetadata): string | null {
  if (meta.interFetchStatus !== 'failed' || !meta.interFetchError?.trim()) {
    return null;
  }
  return `Última actualización automática en web falló: ${meta.interFetchError}`;
}
