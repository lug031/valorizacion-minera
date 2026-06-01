import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useDeviceBindingStore } from '../../src/presentation/store/device-binding-store';
import { useDeviceBindingGuard } from '../../src/presentation/hooks/use-device-binding-guard';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AppLayout() {
  const { user, isHydrated } = useAuthStore();
  const { gateStatus, isHydrated: bindingHydrated } = useDeviceBindingStore();
  useDeviceBindingGuard(isHydrated && bindingHydrated);

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
