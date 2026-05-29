import Constants from 'expo-constants';

type Extra = Record<string, string | undefined>;

function getExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

/** Lee EXPO_PUBLIC_* desde process.env (dev) o expo.extra (release APK). */
export function readPublicEnv(name: string, ...fallbackNames: string[]): string | undefined {
  const names = [name, ...fallbackNames];
  for (const key of names) {
    const fromProcess = process.env[key]?.trim();
    if (fromProcess) return fromProcess;
    const fromExtra = getExtra()[key]?.trim();
    if (fromExtra) return fromExtra;
  }
  return undefined;
}

export function requirePublicEnv(name: string, ...fallbackNames: string[]): string {
  const value = readPublicEnv(name, ...fallbackNames);
  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${[name, ...fallbackNames].join(' o ')}`);
  }
  return value;
}
