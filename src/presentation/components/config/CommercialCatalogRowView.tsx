import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { ReadonlyMetricField } from '../ui/ReadonlyMetricField';
import { TwoColumnGrid } from '../ui/TwoColumnGrid';
import { formatConfigChangeTimestamp, formatConfigChangeValue } from '../../utils/format-config-changelog';
import { cotizadorColors } from '../../theme/cotizador-styles';
import type { CommercialCatalogRow } from '../../utils/build-commercial-catalog-view';

interface Props {
  row: CommercialCatalogRow;
}

function ValueCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.valueCell, highlight && styles.valueCellHighlight]}>
      <Text variant="labelSmall" style={styles.valueCellLabel}>
        {label}
      </Text>
      <Text variant="titleMedium" style={[styles.valueCellText, highlight && styles.valueCellTextHighlight]}>
        {value || '—'}
      </Text>
    </View>
  );
}

/**
 * Fila de catálogo comercial: label fijo. Si hubo cambio, muestra antes y ahora sin tachar.
 */
export function CommercialCatalogRowView({ row }: Props) {
  const isChanged = row.status !== 'unchanged';

  if (!isChanged) {
    return (
      <View style={styles.block}>
        <ReadonlyMetricField label={row.label} value={row.currentValue} />
      </View>
    );
  }

  const beforeValue = formatConfigChangeValue(row.previousValue);
  const afterValue =
    row.status === 'removed'
      ? '—'
      : formatConfigChangeValue(row.newValue ?? row.currentValue);

  return (
    <View style={styles.block}>
      <Text variant="labelSmall" style={styles.fieldLabel}>
        {row.label}
      </Text>
      <TwoColumnGrid
        stackOnNarrow
        left={<ValueCell label="Antes" value={beforeValue} />}
        right={<ValueCell label="Ahora (web)" value={afterValue} highlight />}
      />
      {row.previousRecordedAt || row.newRecordedAt ? (
        <View style={styles.dates}>
          {row.previousRecordedAt ? (
            <Text variant="bodySmall" style={styles.dateLine}>
              Antes: {formatConfigChangeTimestamp(row.previousRecordedAt)}
            </Text>
          ) : null}
          {row.newRecordedAt ? (
            <Text variant="bodySmall" style={styles.dateLine}>
              Ahora: {formatConfigChangeTimestamp(row.newRecordedAt)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 8,
  },
  fieldLabel: {
    opacity: 0.75,
    fontWeight: '600',
    marginBottom: 6,
    marginHorizontal: 2,
    color: '#475569',
  },
  valueCell: {
    backgroundColor: cotizadorColors.readonlyBg,
    borderWidth: 1,
    borderColor: cotizadorColors.readonlyBorder,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  valueCellHighlight: {
    borderColor: '#1a3a5c',
    borderWidth: 1.5,
    backgroundColor: '#e3edf7',
  },
  valueCellLabel: {
    opacity: 0.75,
    marginBottom: 2,
    fontWeight: '600',
  },
  valueCellText: {
    fontWeight: '700',
    color: '#334155',
    fontVariant: ['tabular-nums'],
  },
  valueCellTextHighlight: {
    color: '#1a3a5c',
  },
  dates: {
    marginTop: 6,
    marginHorizontal: 2,
    gap: 2,
  },
  dateLine: {
    fontSize: 10,
    opacity: 0.65,
    color: '#64748b',
  },
});
