/**
 * Identidad técnica para sincronización GraphQL (WEB → móvil).
 *
 * Separada del actor operativo (`AppActor` / login local SQLite).
 * Hoy usa Cognito vía credenciales embebidas EXPO_PUBLIC_SYNC_* cuando no hay sesión activa.
 * Fases posteriores: credenciales delegadas, device binding o token de servicio por dispositivo.
 */
export { ensureSyncIdentity, getMobileDataClient } from './mobile-data-client';
