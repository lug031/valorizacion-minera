const fs = require('fs');
const path = require('path');

/** Carga .env en process.env antes del bundle (release APK incluye extra). */
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PUBLIC_ENV_KEYS = [
  'EXPO_PUBLIC_AWS_REGION',
  'EXPO_PUBLIC_AWS_USER_POOL_ID',
  'EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID',
  'EXPO_PUBLIC_AWS_APPSYNC_ENDPOINT',
  'EXPO_PUBLIC_APPSYNC_ENDPOINT',
  'EXPO_PUBLIC_SYNC_USERNAME',
  'EXPO_PUBLIC_SYNC_PASSWORD',
];

const extra = Object.fromEntries(
  PUBLIC_ENV_KEYS.map((key) => [key, process.env[key] ?? ''])
);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Valorización Minera',
    slug: 'valorizacion-minera',
    version: '0.1.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    scheme: 'valorizacion-minera',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    android: {
      package: 'com.valorizacion.minera',
      adaptiveIcon: {
        backgroundColor: '#1a3a5c',
      },
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-sqlite', 'expo-asset', 'expo-font'],
    experiments: {
      typedRoutes: true,
    },
    extra,
  },
};
