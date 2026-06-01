import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { appTheme } from '../src/presentation/theme/app-theme';
import { useAppBootstrap } from '../src/presentation/hooks/use-app-bootstrap';
import { useDeviceBindingForeground } from '../src/presentation/hooks/use-device-binding-foreground';

export default function RootLayout() {
  const { ready, error } = useAppBootstrap();
  useDeviceBindingForeground(ready);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a3a5c" />
        {error ? <Text style={{ marginTop: 12, color: 'red' }}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
