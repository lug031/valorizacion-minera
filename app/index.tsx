import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/presentation/store/auth-store';

export default function SplashScreen() {
  const { user, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a5c" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
