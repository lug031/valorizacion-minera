import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import {
  enrollFieldDeviceOnCloud,
  enrollmentErrorMessage,
  EnrollmentError,
} from '../../src/services/device/device-enrollment.service';

export default function ActivateDeviceScreen() {
  const { user, login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  if (user) {
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
      setError('Se requiere conexión a internet para activar el dispositivo.');
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
        router.replace('/(app)/dashboard');
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
            subtitle="Requiere internet una sola vez. Use el código que le envió el administrador."
          />
          <Text variant="bodySmall" style={styles.hint}>
            Username y contraseña de campo (no el correo del panel web). Tras activar, el login diario
            funciona sin conexión.
          </Text>
          <TextInput
            mode="outlined"
            label="Usuario de campo"
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
            Ya activé este teléfono — iniciar sesión
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
  hint: { marginBottom: 16, opacity: 0.75, lineHeight: 18 },
  field: { marginBottom: 12 },
  btn: { marginTop: 16 },
  btnContent: { paddingVertical: 8 },
});
