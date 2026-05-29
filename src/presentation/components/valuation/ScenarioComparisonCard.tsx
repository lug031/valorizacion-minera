import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import type { ValuationCalculationResult } from '../../../domain/models/calculation';
import { formatMoney } from '../../utils/format';
import {
  buildScenarioComparison,
  findBestScenarioTotal,
} from '../../utils/scenario-comparison';

interface Props {
  result: ValuationCalculationResult | null;
  highlightLabel?: string;
}

/**
 * Tarjeta comparativa A/B/C (totales y diferencias vs referencia).
 * Feature preparada para futuras versiones comerciales; oculta en V1 vía flag centralizado.
 */
export function ScenarioComparisonCard({ result, highlightLabel }: Props) {
  if (!result || result.scenarios.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Comparación de escenarios</Text>
          <Text>Ingrese los datos del lote para ver la comparación.</Text>
        </Card.Content>
      </Card>
    );
  }

  const rows = buildScenarioComparison(result.scenarios);
  const best = findBestScenarioTotal(result.scenarios);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          Comparación A · B · C
        </Text>
        <Text variant="bodySmall" style={styles.sub}>
          TMS: {result.tms} · Mayor total: {best}
        </Text>
        <Divider style={styles.divider} />
        {rows.map((row) => {
          const isHighlight = highlightLabel ? row.label === highlightLabel : row.label === 'A';
          return (
            <View key={row.label} style={[styles.row, isHighlight && styles.rowHighlight]}>
              <View style={styles.rowHead}>
                <Text variant="titleMedium" style={styles.label}>
                  {row.label}
                </Text>
                <Text variant="bodySmall" numberOfLines={1} style={styles.name}>
                  {row.name}
                </Text>
              </View>
              <Text variant="bodySmall">AU x TMS: {formatMoney(row.valorAuPerTms)}</Text>
              <Text variant="bodySmall">AG x TMS: {formatMoney(row.valorAgPerTms)}</Text>
              <Text variant="bodySmall">Final x TMS: {formatMoney(row.valorFinalPerTms)}</Text>
              <Text variant="titleMedium" style={styles.total}>
                Total: {formatMoney(row.valorCompraTotal)}
              </Text>
              {row.diffTotalVsA != null ? (
                <Text
                  variant="bodySmall"
                  style={
                    parseFloat(row.diffTotalVsA) >= 0 ? styles.diffUp : styles.diffDown
                  }
                >
                  vs A: {parseFloat(row.diffTotalVsA) >= 0 ? '+' : ''}
                  {formatMoney(row.diffTotalVsA)}
                </Text>
              ) : (
                <Text variant="bodySmall" style={styles.ref}>
                  Referencia
                </Text>
              )}
              <Divider style={styles.rowDivider} />
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b8c4d0',
    borderRadius: 4,
  },
  title: { fontWeight: '700' },
  sub: { opacity: 0.75, marginTop: 4, marginBottom: 4 },
  divider: { marginVertical: 10 },
  row: { paddingVertical: 6 },
  rowHighlight: { backgroundColor: '#e3edf7', borderRadius: 8, paddingHorizontal: 8 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: { fontWeight: '800', color: '#1a3a5c', minWidth: 28 },
  name: { flex: 1, opacity: 0.85 },
  total: { fontWeight: '700', marginTop: 4 },
  diffUp: { color: '#2e7d32', marginTop: 2 },
  diffDown: { color: '#c62828', marginTop: 2 },
  ref: { opacity: 0.6, marginTop: 2 },
  rowDivider: { marginTop: 8 },
});
