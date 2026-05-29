import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { cotizadorColors } from '../../theme/cotizador-styles';

interface Props {
  label: string;
  value: string;
  highlight?: boolean;
}

/** Campo calculado (TMS, ley derivada) — estilo celda Excel readonly. */
export function ReadonlyMetricField({ label, value, highlight }: Props) {
  return (
    <View style={[styles.wrap, highlight && styles.highlight]}>
      <Text variant="labelSmall" style={styles.label}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.value}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: cotizadorColors.readonlyBg,
    borderWidth: 1,
    borderColor: cotizadorColors.readonlyBorder,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
    minHeight: 52,
    justifyContent: 'center',
  },
  highlight: {
    borderColor: '#1a3a5c',
    borderWidth: 1.5,
    backgroundColor: '#e3edf7',
  },
  label: {
    opacity: 0.75,
    marginBottom: 2,
    fontWeight: '600',
  },
  value: {
    fontWeight: '700',
    color: '#1a3a5c',
    fontVariant: ['tabular-nums'],
  },
});
