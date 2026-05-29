import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import type {
  ScenarioCalculationResult,
  ValuationCalculationResult,
} from '../../../domain/models/calculation';
import { formatMoney } from '../../utils/format';
import { CotizadorSection } from '../ui/CotizadorSection';
import { cotizadorColors, cotizadorStyles } from '../../theme/cotizador-styles';

interface Props {
  result: ValuationCalculationResult | null;
  scenario: ScenarioCalculationResult | null;
}

export function ValuationResultsPanel({ result, scenario }: Props) {
  if (!result || !scenario) {
    return (
      <CotizadorSection title="RESULTADOS">
        <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
          Complete los datos del lote para ver la cotización.
        </Text>
      </CotizadorSection>
    );
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Valor AU x TMS', value: formatMoney(scenario.valorAuPerTms) },
    { label: 'Valor AG x TMS', value: formatMoney(scenario.valorAgPerTms) },
    { label: 'Valor Final x TMS', value: formatMoney(scenario.valorFinalPerTms) },
  ];

  return (
    <CotizadorSection title="RESULTADOS">
      {rows.map((row, i) => (
        <View
          key={row.label}
          style={[cotizadorStyles.resultRow, i % 2 === 1 && cotizadorStyles.resultRowAlt]}
        >
          <Text variant="bodyLarge" style={styles.label}>
            {row.label}
          </Text>
          <Text variant="titleMedium" style={styles.value}>
            {row.value}
          </Text>
        </View>
      ))}
      <Divider style={{ marginVertical: 6 }} />
      <View style={cotizadorStyles.resultsHero}>
        <Text style={cotizadorStyles.resultsHeroLabel}>Valor compra total</Text>
        <Text style={cotizadorStyles.resultsHeroValue}>
          {formatMoney(scenario.valorCompraTotal)}
        </Text>
      </View>
    </CotizadorSection>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: '#2c3e50' },
  value: { fontWeight: '700', color: cotizadorColors.headerBg, fontVariant: ['tabular-nums'] },
});
