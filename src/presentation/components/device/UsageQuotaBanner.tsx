import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useUsageQuotaStore } from '../../store/usage-quota-store';
import { formatUsageDurationMs } from '../../utils/format-usage-quota';

export function UsageQuotaBanner() {
  const gateStatus = useUsageQuotaStore((s) => s.gateStatus);
  const accumulatedMs = useUsageQuotaStore((s) => s.accumulatedMs);
  const limitMs = useUsageQuotaStore((s) => s.limitMs);
  const remainingMs = useUsageQuotaStore((s) => s.remainingMs);
  const isHydrated = useUsageQuotaStore((s) => s.isHydrated);

  if (!isHydrated || gateStatus === 'standard' || gateStatus === 'unknown' || limitMs <= 0) {
    return null;
  }

  const tone =
    gateStatus === 'exceeded' || remainingMs <= 15 * 60_000
      ? styles.warning
      : styles.info;

  return (
    <View style={[styles.banner, tone.box]}>
      <Text variant="bodySmall" style={tone.text}>
        Modo prueba: {formatUsageDurationMs(accumulatedMs)} / {formatUsageDurationMs(limitMs)} de uso
        {gateStatus === 'exceeded'
          ? ' — cupo agotado'
          : ` — restan ${formatUsageDurationMs(remainingMs)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  info: {
    box: { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' },
    text: { color: '#5b21b6', lineHeight: 18 },
  },
  warning: {
    box: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    text: { color: '#92400e', lineHeight: 18 },
  },
});
