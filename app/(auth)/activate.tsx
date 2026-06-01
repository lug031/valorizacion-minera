import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Button, TextInput, HelperText } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useDeviceBindingStore } from '../../src/presentation/store/device-binding-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import {
  enrollFieldDeviceOnCloud,
  enrollmentErrorMessage,
  EnrollmentError,
} from '../../src/services/device/device-enrollment.service';
import { refreshDeviceBindingGate } from '../../src/services/device/refresh-device-binding';

export default function ActivateDeviceScreen() {
  const { user, login, isLoading } = useAuthStore();
  const { gateStatus, isHydrated: bindingHydrated } = useDeviceBindingStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  if (user && bindingHydrated && gateStatus !== 'blocked') {
    return <Redirect href="/(app)/dashboard" />;
  }

  const onSubmit = async () => {
    setError(null);
    if (!username.trim() || !password.trim() || !enrollmentCode.trim()) {
      setError('Complete usuario, contraseña y código de activación');
      return;
    }

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      setError('Conéctese a internet para activar el teléfono.');
      return;
    }

    setActivating(true);
    try {
      await enrollFieldDeviceOnCloud({
        username: username.trim(),
        password,
        enrollmentCode: enrollmentCode.trim(),
      });

      const ok = await login(username.trim(), password);
      if (ok) {
        await refreshDeviceBindingGate();
        const gate = useDeviceBindingStore.getState().gateStatus;
        router.replace(gate === 'blocked' ? '/(auth)/device-blocked' : '/(app)/dashboard');
      } else {
        setError('Dispositivo activado, pero no se pudo iniciar sesión. Intente ingresar manualmente.');
      }
    } catch (e) {
      if (e instanceof EnrollmentError) {
        setError(enrollmentErrorMessage(e.code));
      } else {
        setError(e instanceof Error ? e.message : 'No se pudo activar el dispositivo.');
      }
    } finally {
      setActivating(false);
    }
  };

  const busy = isLoading || activating;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <ScreenHeader
            title="Activar dispositivo"
            subtitle="Ingrese el código que le envió el administrador."
          />
          <TextInput
            mode="outlined"
            label="Usuario"
            placeholder="ej. jperez"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label="Código de activación"
            placeholder="XXXX-XXXX"
            value={enrollmentCode}
            onChangeText={setEnrollmentCode}
            autoCapitalize="characters"
            style={styles.field}
          />
          {error ? <HelperText type="error">{error}</HelperText> : null}
          <Button
            mode="contained"
            onPress={() => void onSubmit()}
            loading={busy}
            disabled={busy}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Activar dispositivo
          </Button>
          <Button mode="text" onPress={() => router.replace('/(auth)/login')} disabled={busy}>
            Volver al inicio de sesión
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f8' },
  flex: { flex: 1 },
  inner: { flex: 1, padding: screenPadding, justifyContent: 'center' },
  field: { marginBottom: 12 },
  btn: { marginTop: 16 },
  btnContent: { paddingVertical: 8 },
});
