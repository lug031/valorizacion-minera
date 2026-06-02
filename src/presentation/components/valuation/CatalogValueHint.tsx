import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { CatalogValueHint } from '../../utils/catalog-value-hint';

interface Props {
  hint: CatalogValueHint | null;
}

/** Valor maestro actual de la web, distinto al guardado en la cotización en edición. */
export function CatalogValueHint({ hint }: Props) {
  if (!hint) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="bodySmall" style={styles.title}>
        {hint.title}
      </Text>
      <Text variant="bodySmall" style={styles.value}>
        {hint.valueLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 2,
    marginBottom: 6,
    paddingLeft: 2,
  },
  title: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  value: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 15,
  },
});
