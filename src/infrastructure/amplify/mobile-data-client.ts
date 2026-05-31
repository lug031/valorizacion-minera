import { fetchAuthSession, getCurrentUser, signIn } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { readPublicEnv } from '../../config/runtime-env';
import { configureAmplify } from './configure-amplify';

let client: { graphql: (input: { query: string }) => Promise<unknown> } | null = null;

/**
 * Autentica la identidad técnica de sync (no el operador de campo).
 * Prioriza sesión Cognito existente; si no hay, usa EXPO_PUBLIC_SYNC_USERNAME/PASSWORD.
 */
export async function ensureSyncIdentity(): Promise<void> {
  configureAmplify();
  try {
    await getCurrentUser();
    await fetchAuthSession();
    return;
  } catch {
    // Continúa con login técnico opcional.
  }

  const username = readPublicEnv('EXPO_PUBLIC_SYNC_USERNAME');
  const password = readPublicEnv('EXPO_PUBLIC_SYNC_PASSWORD');
  if (!username || !password) {
    throw new Error(
      'No hay sesión Cognito disponible para sincronizar. Configure EXPO_PUBLIC_SYNC_USERNAME y EXPO_PUBLIC_SYNC_PASSWORD.'
    );
  }

  try {
    const result = await signIn({ username, password });
    if (result.nextStep.signInStep !== 'DONE') {
      throw new Error('La identidad técnica de sincronización requiere un paso adicional no soportado.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(
      `No se pudo iniciar sesión para sincronizar. Verifique EXPO_PUBLIC_SYNC_USERNAME/EXPO_PUBLIC_SYNC_PASSWORD y el estado del usuario en Cognito. Detalle: ${message}`
    );
  }
}

export function getMobileDataClient() {
  configureAmplify();
  if (!client) {
    client = generateClient() as { graphql: (input: { query: string }) => Promise<unknown> };
  }
  return client;
}
