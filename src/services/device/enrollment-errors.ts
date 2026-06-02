export type EnrollmentErrorCode =
  | 'FIELD_USER_NOT_FOUND'
  | 'FIELD_USER_INACTIVE'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_NOT_PENDING'
  | 'DEVICE_BLOCKED'
  | 'DEVICE_QUOTA_EXCEEDED'
  | 'INVALID_ENROLLMENT_CODE'
  | 'ENROLLMENT_CODE_EXPIRED'
  | 'ENROLLMENT_CODE_USED'
  | 'INVALID_CREDENTIALS'
  | 'FINGERPRINT_ALREADY_BOUND'
  | 'RATE_LIMITED'
  | 'INVALID_FINGERPRINT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

const CODE_RE = /^\[([A-Z_]+)\]\s*(.*)$/;

export class EnrollmentError extends Error {
  readonly code: EnrollmentErrorCode;

  constructor(code: EnrollmentErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'EnrollmentError';
  }
}

export function parseEnrollmentError(err: unknown): EnrollmentError {
  const message = err instanceof Error ? err.message : String(err);
  const lowered = message.toLowerCase();

  if (
    lowered.includes('token de sesión') ||
    lowered.includes('secret de sesión') ||
    lowered.includes('device_session_token')
  ) {
    return new EnrollmentError(
      'UNKNOWN',
      'El dispositivo quedó activado en el servidor, pero falta configurar la sesión en la nube. Contacte soporte o reintente el inicio de sesión tras actualizar la app.'
    );
  }

  if (
    lowered.includes('network') ||
    lowered.includes('offline') ||
    lowered.includes('internet') ||
    lowered.includes('failed to fetch')
  ) {
    return new EnrollmentError(
      'NETWORK_ERROR',
      'Conéctese a internet para activar el teléfono.'
    );
  }

  const match = message.match(CODE_RE);
  if (match) {
    const code = match[1] as EnrollmentErrorCode;
    const text = match[2] || message;
    return new EnrollmentError(code, text);
  }

  return new EnrollmentError('UNKNOWN', message);
}

export function enrollmentErrorMessage(code: EnrollmentErrorCode): string {
  switch (code) {
    case 'INVALID_ENROLLMENT_CODE':
    case 'ENROLLMENT_CODE_EXPIRED':
    case 'ENROLLMENT_CODE_USED':
      return 'Código inválido o expirado. Pida uno nuevo al administrador.';
    case 'INVALID_CREDENTIALS':
      return 'Usuario o contraseña incorrectos.';
    case 'DEVICE_BLOCKED':
      return 'Este teléfono está suspendido. Contacte al administrador.';
    case 'DEVICE_QUOTA_EXCEEDED':
      return 'Ya hay teléfonos autorizados para esta cuenta. Contacte al administrador.';
    case 'FINGERPRINT_ALREADY_BOUND':
      return 'Este teléfono ya está registrado en otra cuenta.';
    case 'RATE_LIMITED':
      return 'Demasiados intentos. Espere 15 minutos o pida un código nuevo.';
    case 'NETWORK_ERROR':
      return 'Conéctese a internet para activar el teléfono.';
    case 'FIELD_USER_INACTIVE':
      return 'Usuario de campo desactivado. Contacte al administrador.';
    default:
      return 'No se pudo activar el teléfono. Verifique los datos o contacte al administrador.';
  }
}
