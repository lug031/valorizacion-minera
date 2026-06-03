import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useDeviceBindingStore } from '../../src/presentation/store/device-binding-store';
import { useDeviceBindingGuard } from '../../src/presentation/hooks/use-device-binding-guard';
import { useDeviceBindingForeground } from '../../src/presentation/hooks/use-device-binding-foreground';
import { useSensitiveScreenCaptureGuard } from '../../src/presentation/hooks/use-sensitive-screen-capture-guard';
import { useCommercialSyncOnRoute } from '../../src/presentation/hooks/use-commercial-sync-on-route';
import { useUsageQuotaGuard } from '../../src/presentation/hooks/use-usage-quota-guard';
import { useUsageQuotaTracker } from '../../src/presentation/hooks/use-usage-quota-tracker';
import { useUsageQuotaStore } from '../../src/presentation/store/usage-quota-store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AppLayout() {
  const { user, isHydrated } = useAuthStore();
  const { gateStatus, isHydrated: bindingHydrated } = useDeviceBindingStore();
  const usageHydrated = useUsageQuotaStore((s) => s.isHydrated);
  const usageGate = useUsageQuotaStore((s) => s.gateStatus);
  const appReady = Boolean(user && isHydrated && bindingHydrated);
  useDeviceBindingGuard(appReady);
  useDeviceBindingForeground(appReady);
  useUsageQuotaTracker(appReady);
  useUsageQuotaGuard(appReady);
  useSensitiveScreenCaptureGuard();
  useCommercialSyncOnRoute(Boolean(appReady && gateStatus !== 'blocked' && usageGate !== 'exceeded'));

  if (!isHydrated || !bindingHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (gateStatus === 'blocked') {
    return <Redirect href="/(auth)/device-blocked" />;
  }

  if (usageHydrated && usageGate === 'exceeded') {
    return <Redirect href="/(auth)/usage-blocked" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a3a5c' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
