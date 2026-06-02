import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { INTER_SOURCE_LABELS } from '../../../domain/constants/inter-metadata';
import type { InterSyncMetadata } from '../../store/settings-store';
import {
  buildInterFetchStatusHint,
  hasValidInterSyncMetadata,
} from '../../utils/inter-sync-hint';
import { formatPeruDateTime } from '../../../utils/peru-datetime';

function formatTimestamp(iso: string | null | undefined): string {
  return formatPeruDateTime(iso);
}

function sourceLabel(source: string | null | undefined): string {
  if (!source?.trim()) return 'Sin registrar';
  return INTER_SOURCE_LABELS[source] ?? source;
}

interface Props {
  interGold: string;
  interSilver: string;
  meta: InterSyncMetadata;
  lastSyncAt: string | null;
  compact?: boolean;
}

function InterMetadataEmptyState({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.detail}>Fuente: Sin registrar</Text>
      <Text style={styles.detail}>Obtenido: —</Text>
      <Text style={styles.detail}>Estado: Sin sincronización previa</Text>
      {!compact ? (
        <Text style={[styles.detail, styles.rowGap]}>
          Los valores del formulario son locales o del cotizador, no una referencia sincronizada.
        </Text>
      ) : null}
    </View>
  );
}

/** Resumen de metadata INTER maestra (config / sync). */
export function InterMetadataSummary({ interGold, interSilver, meta, lastSyncAt, compact }: Props) {
  const fetchWarning = buildInterFetchStatusHint(meta);

  if (!hasValidInterSyncMetadata(meta)) {
    return <InterMetadataEmptyState compact={compact} />;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>INTER oro</Text>
        <Text style={styles.value}>US$ {interGold}</Text>
      </View>
      <Text style={styles.detail}>
        Fuente: {sourceLabel(meta.interGoldSource)} · Obtenido: {formatTimestamp(meta.interGoldFetchedAt)}
      </Text>

      <View style={[styles.row, styles.rowGap]}>
        <Text style={styles.label}>INTER plata</Text>
        <Text style={styles.value}>US$ {interSilver}</Text>
      </View>
      <Text style={styles.detail}>
        Fuente: {sourceLabel(meta.interSilverSource)} · Obtenido:{' '}
        {formatTimestamp(meta.interSilverFetchedAt)}
      </Text>

      {!compact ? (
        <>
          <Text style={[styles.detail, styles.rowGap]}>
            Última sync config: {formatTimestamp(lastSyncAt)}
          </Text>
          {meta.interFetchStatus ? (
            <Text style={styles.detail}>Estado web: {meta.interFetchStatus}</Text>
          ) : null}
        </>
      ) : null}

      {fetchWarning ? (
        <Text style={styles.warning}>{fetchWarning}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowGap: { marginTop: 8 },
  label: { fontSize: 13, color: '#475569' },
  value: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  detail: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },
  warning: {
    marginTop: 8,
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
  },
});
