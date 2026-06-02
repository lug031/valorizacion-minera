import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { formatConfigChangeTimestamp, formatConfigChangeValue } from '../../utils/format-config-changelog';
import type { CommercialCatalogRow } from '../../utils/build-commercial-catalog-view';

const STATUS_LABEL: Record<CommercialCatalogRow['status'], string> = {
  unchanged: 'Sin cambios',
  changed: 'Actualizado',
  added: 'Nuevo',
  removed: 'Eliminado',
};

interface Props {
  row: CommercialCatalogRow;
}

export function CommercialCatalogRowView({ row }: Props) {
  const isChanged = row.status !== 'unchanged';

  if (!isChanged) {
    return (
      <View style={styles.unchangedRow}>
        <Text variant="bodySmall" style={styles.unchangedLabel} numberOfLines={2}>
          {row.label}
        </Text>
        <Text variant="bodyMedium" style={styles.unchangedValue} numberOfLines={2}>
          {row.currentValue}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.changedWrap,
        row.status === 'added' && styles.changedAdded,
        row.status === 'removed' && styles.changedRemoved,
      ]}
    >
      <View style={styles.changedHeader}>
        <Text variant="labelLarge" style={styles.changedLabel}>
          {row.label}
        </Text>
        <View
          style={[
            styles.badge,
            row.status === 'added' && styles.badgeAdded,
            row.status === 'removed' && styles.badgeRemoved,
          ]}
        >
          <Text style={styles.badgeText}>{STATUS_LABEL[row.status]}</Text>
        </View>
      </View>
      <View style={styles.compareRow}>
        <Text variant="bodySmall" style={styles.compareLabel}>
          Antes
        </Text>
        <Text style={styles.compareOld}>{formatConfigChangeValue(row.previousValue)}</Text>
      </View>
      {row.previousRecordedAt ? (
        <Text variant="bodySmall" style={styles.dateLine}>
          {formatConfigChangeTimestamp(row.previousRecordedAt)}
        </Text>
      ) : null}
      <View style={styles.compareRow}>
        <Text variant="bodySmall" style={styles.compareLabel}>
          Ahora (web)
        </Text>
        <Text style={styles.compareNew}>{formatConfigChangeValue(row.newValue ?? row.currentValue)}</Text>
      </View>
      {row.newRecordedAt ? (
        <Text variant="bodySmall" style={styles.dateLine}>
          {formatConfigChangeTimestamp(row.newRecordedAt)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  unchangedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  unchangedLabel: {
    flex: 1,
    opacity: 0.75,
    color: '#475569',
  },
  unchangedValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
    color: '#334155',
  },
  changedWrap: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
  },
  changedAdded: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  changedRemoved: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  changedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  changedLabel: {
    flex: 1,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  badge: {
    backgroundColor: '#b45309',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAdded: {
    backgroundColor: '#15803d',
  },
  badgeRemoved: {
    backgroundColor: '#b91c1c',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  compareRow: {
    marginTop: 4,
  },
  compareLabel: {
    opacity: 0.7,
    fontSize: 11,
  },
  compareOld: {
    fontWeight: '600',
    color: '#64748b',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  compareNew: {
    fontWeight: '700',
    color: '#1a3a5c',
    marginTop: 2,
  },
  dateLine: {
    fontSize: 10,
    opacity: 0.65,
    marginTop: 2,
    marginBottom: 2,
  },
});
