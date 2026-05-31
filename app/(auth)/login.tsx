import { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { getEnrollmentMode } from '../../src/infrastructure/device/enrollment-store';

const LOGIN_ERROR =
  'Usuario o contraseña incorrectos. Si acaba de crearlo en la web, sincronice usuarios (admin) o active el dispositivo con código.';

export default function LoginScreen() {
  const { user, login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enrollmentMode, setEnrollmentMode] = useState<'legacy_roster' | 'enrolled' | null>(null);

  useEffect(() => {
    void getEnrollmentMode().then(setEnrollmentMode);
  }, []);

  if (user) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const onSubmit = async () => {
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Ingrese usuario y contraseña');
      return;
    }
    const ok = await login(username.trim(), password);
    if (ok) {
      router.replace('/(app)/dashboard');
    } else {
      setError(LOGIN_ERROR);
    }
  };

  const showLegacyHint = enrollmentMode !== 'enrolled';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <ScreenHeader
            title="Iniciar sesión"
            subtitle="Use su usuario de campo creado en la web. No use el correo del panel web."
          />
          {showLegacyHint ? (
            <Text variant="bodySmall" style={styles.bootstrapHint}>
              Teléfono nuevo: pida un código al administrador y use «Activar dispositivo». En equipos
              legacy, un admin debe sincronizar usuarios de campo antes del primer login.
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.bootstrapHint}>
              Este teléfono ya está activado. Inicie sesión con su usuario de campo.
            </Text>
          )}
          <TextInput
            mode="outlined"
            label="Usuario de campo"
            placeholder="ej. admin.campo o jperez"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label="Contraseña"
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.field}
          />
          {error ? <HelperText type="error">{error}</HelperText> : null}
          <Button
            mode="contained"
            onPress={() => void onSubmit()}
            loading={isLoading}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Ingresar
          </Button>
          <Button mode="text" onPress={() => router.push('/(auth)/activate')} style={styles.linkBtn}>
            Activar dispositivo con código
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
  bootstrapHint: { marginBottom: 16, opacity: 0.75, lineHeight: 18 },
  field: { marginBottom: 12 },
  btn: { marginTop: 16 },
  btnContent: { paddingVertical: 8 },
  linkBtn: { marginTop: 8 },
});
