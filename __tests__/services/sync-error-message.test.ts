import {
  extractSyncErrorMessage,
  isDeviceSessionSyncError,
  mapConfigSyncErrorMessage,
} from '../../src/services/sync/sync-error-message';

describe('sync-error-message', () => {
  it('extrae mensaje de objetos GraphQL', () => {
    expect(
      extractSyncErrorMessage({ errors: [{ message: 'INVALID_SESSION_TOKEN' }] })
    ).toBe('INVALID_SESSION_TOKEN');
  });

  it('detecta errores de sesión de dispositivo', () => {
    expect(
      isDeviceSessionSyncError('Sesión de dispositivo no válida. Cierre sesión y vuelva a entrar.')
    ).toBe(true);
  });

  it('mapea token inválido a mensaje operativo', () => {
    expect(mapConfigSyncErrorMessage(new Error('INVALID_SESSION_TOKEN'))).toMatch(/sesión/i);
  });
});
