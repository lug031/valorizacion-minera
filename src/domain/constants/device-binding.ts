/** Fase 3.1: pasar a true cuando el enrollment y bloqueo estén listos. */
export const DEVICE_BINDING_REQUIRED = false;

/** Cupos activos por rol (alineado al modelo híbrido cloud). */
export const MAX_ACTIVE_DEVICES_BY_ROLE = {
  operador: 1,
  admin: 2,
} as const;

export const DEFAULT_GRACE_DAYS_OFFLINE = 7;
