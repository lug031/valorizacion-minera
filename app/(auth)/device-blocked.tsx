import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useDeviceBindingStore } from '../../src/presentation/store/device-binding-store';
import { getDeviceBindingScreenContent } from '../../src/presentation/content/device-binding-messages';
import { refreshDeviceBindingGate } from '../../src/services/device/refresh-device-binding';

export default function DeviceBlockedScreen() {
  const { user, logout } = useAuthStore();
  const { gateStatus, checkResult, isHydrated } = useDeviceBindingStore();
  const [retrying, setRetrying] = useState(false);

  if (!isHydrated) {
    return null;
  }

  if (gateStatus !== 'blocked') {
    if (user) return <Redirect href="/(app)/dashboard" />;
    return <Redirect href="/(auth)/login" />;
  }

  const content = getDeviceBindingScreenContent(checkResult);

  const onRetry = async () => {
    setRetrying(true);
    try {
      await refreshDeviceBindingGate();
      const next = useDeviceBindingStore.getState();
      if (next.gateStatus === 'allowed' || next.gateStatus === 'legacy') {
        router.replace(user ? '/(app)/dashboard' : '/(auth)/login');
      }
    } finally {
      setRetrying(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <ScreenHeader title={content.title} subtitle={content.body} />
        <Text variant="bodySmall" style={styles.hint}>
          Los teléfonos en modo legacy (sin activación por código) no aplican este bloqueo.
        </Text>
        {content.showRetry ? (
          <Button mode="contained" onPress={onRetry} loading={retrying} style={styles.button}>
            Reintentar validación
          </Button>
        ) : null}
        {content.showActivateLink ? (
          <Button mode="outlined" onPress={() => router.replace('/(auth)/activate')} style={styles.button}>
            Activar dispositivo
          </Button>
        ) : null}
        {content.showLogout && user ? (
          <Button mode="text" onPress={onLogout} style={styles.button}>
            Cerrar sesión
          </Button>
        ) : null}
        {!user ? (
          <Button mode="text" onPress={() => router.replace('/(auth)/login')} style={styles.button}>
            Volver al inicio de sesión
          </Button>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7fa' },
  inner: { flex: 1, padding: screenPadding, justifyContent: 'center' },
  hint: { marginBottom: 24, color: '#64748b' },
  button: { marginTop: 8 },
});
