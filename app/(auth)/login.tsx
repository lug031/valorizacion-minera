import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';

export default function LoginScreen() {
  const { user, login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <ScreenHeader
            title="Iniciar sesión"
            subtitle="Ingrese usuario y contraseña"
          />
          <TextInput
            mode="outlined"
            label="Usuario"
            placeholder="Usuario"
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
            onPress={onSubmit}
            loading={isLoading}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Ingresar
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
