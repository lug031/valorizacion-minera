import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { InterMetalHint } from '../../utils/inter-sync-hint';

interface Props {
  hint: InterMetalHint | null;
}

/** Hint informativo debajo del campo INTER (referencia maestra sincronizada). */
export function InterSyncedHint({ hint }: Props) {
  if (!hint) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="bodySmall" style={styles.title}>
        {hint.title}
      </Text>
      <Text variant="bodySmall" style={styles.value}>
        {hint.valueLine}
      </Text>
      {hint.detailLine ? (
        <Text variant="bodySmall" style={styles.detail}>
          {hint.detailLine}
        </Text>
      ) : null}
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
  detail: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
});
