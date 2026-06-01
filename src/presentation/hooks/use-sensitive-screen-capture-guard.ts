import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSegments } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { isValuationSensitiveRoute } from '../../config/sensitive-screen-routes';

const GUARD_KEY = 'valuation-sensitive-flow';

async function enableProtection(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenCapture.preventScreenCaptureAsync(GUARD_KEY);
  } catch {
    // Sin mensaje al usuario: módulo no disponible en algunos entornos.
  }
}

async function disableProtection(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenCapture.allowScreenCaptureAsync(GUARD_KEY);
  } catch {
    // ignore
  }
}

/**
 * Activa/desactiva bloqueo de captura según la ruta actual (solo flujo valorización/historial).
 * Usar una sola vez en el layout autenticado (app).
 */
export function useSensitiveScreenCaptureGuard(): void {
  const segments = useSegments();
  const isSensitive = isValuationSensitiveRoute(segments);
  const protectedRef = useRef(false);

  useEffect(() => {
    if (isSensitive) {
      if (!protectedRef.current) {
        protectedRef.current = true;
        void enableProtection();
      }
      return;
    }

    if (protectedRef.current) {
      protectedRef.current = false;
      void disableProtection();
    }
  }, [isSensitive]);

  useEffect(() => {
    return () => {
      if (protectedRef.current) {
        protectedRef.current = false;
        void disableProtection();
      }
    };
  }, []);
}
