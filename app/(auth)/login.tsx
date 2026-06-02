import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, HelperText } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useDeviceBindingStore } from '../../src/presentation/store/device-binding-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { refreshDeviceBindingGate } from '../../src/services/device/refresh-device-binding';

const LOGIN_ERROR = 'Usuario o contraseña incorrectos.';

export default function LoginScreen() {
  const { user, login, isLoading } = useAuthStore();
  const { gateStatus, isHydrated: bindingHydrated } = useDeviceBindingStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user && bindingHydrated && gateStatus !== 'blocked') {
    return <Redirect href="/(app)/dashboard" />;
  }
  if (user && bindingHydrated && gateStatus === 'blocked') {
    return <Redirect href="/(auth)/device-blocked" />;
  }

  const onSubmit = async () => {
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Ingrese usuario y contraseña');
      return;
    }
    const ok = await login(username.trim(), password);
    if (ok) {
      await refreshDeviceBindingGate();
      const gate = useDeviceBindingStore.getState().gateStatus;
      router.replace(gate === 'blocked' ? '/(auth)/device-blocked' : '/(app)/dashboard');
    } else {
      setError(LOGIN_ERROR);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <ScreenHeader title="Iniciar sesión" subtitle="Ingrese con su usuario y contraseña." />
          <TextInput
            mode="outlined"
            label="Usuario"
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
            Tengo un código de activación
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
  linkBtn: { marginTop: 8 },
});
