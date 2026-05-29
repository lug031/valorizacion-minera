import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: { fontWeight: '700' },
  sub: { opacity: 0.7, marginTop: 4 },
});
