/** Solo aplica a dispositivos con enrollmentMode=enrolled; legacy queda exento. */
export const DEVICE_BINDING_REQUIRED = true;

/** Cupos activos por rol (alineado al modelo híbrido cloud). */
export const MAX_ACTIVE_DEVICES_BY_ROLE = {
  operador: 1,
  admin: 2,
} as const;

export const DEFAULT_GRACE_DAYS_OFFLINE = 1;
