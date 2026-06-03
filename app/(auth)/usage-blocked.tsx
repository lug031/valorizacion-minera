import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useUsageQuotaStore } from '../../src/presentation/store/usage-quota-store';
import {
  redeemUsageExtensionCode,
  parseUsageExtensionError,
} from '../../src/services/device/usage-extension-redeem.service';
import { refreshUsageQuotaGate } from '../../src/presentation/hooks/use-usage-quota-tracker';

export default function UsageBlockedScreen() {
  const { user, logout } = useAuthStore();
  const { gateStatus, isHydrated } = useUsageQuotaStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isHydrated) {
    return null;
  }

  if (gateStatus !== 'exceeded') {
    if (user) return <Redirect href="/(app)/dashboard" />;
    return <Redirect href="/(auth)/login" />;
  }

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await redeemUsageExtensionCode(code);
      await refreshUsageQuotaGate();
      const next = useUsageQuotaStore.getState();
      if (next.gateStatus === 'allowed' || next.gateStatus === 'standard') {
        router.replace(user ? '/(app)/dashboard' : '/(auth)/login');
      }
    } catch (e) {
      setError(parseUsageExtensionError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <ScreenHeader
          title="Cupo de prueba agotado"
          subtitle="Ha usado las 2 horas permitidas en modo prueba. Solicite al administrador un código de extensión e ingréselo aquí (requiere internet)."
        />
        <TextInput
          label="Código de extensión"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          style={styles.input}
          disabled={submitting}
        />
        {error ? <Text variant="bodySmall" style={styles.error}>{error}</Text> : null}
        <Button mode="contained" onPress={() => void onSubmit()} loading={submitting} style={styles.button}>
          Validar código
        </Button>
        {user ? (
          <Button mode="text" onPress={() => void onLogout()} style={styles.button}>
            Cerrar sesión
          </Button>
        ) : (
          <Button mode="text" onPress={() => router.replace('/(auth)/login')} style={styles.button}>
            Volver al inicio de sesión
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7fa' },
  inner: { flex: 1, padding: screenPadding, justifyContent: 'center' },
  input: { marginTop: 16 },
  error: { color: '#b91c1c', marginTop: 8 },
  button: { marginTop: 12 },
});
