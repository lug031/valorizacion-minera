import { getDeviceBindingScreenContent } from '../../src/presentation/content/device-binding-messages';

describe('device binding screen content', () => {
  it('mapea revocado con reintento y logout', () => {
    const content = getDeviceBindingScreenContent({
      ok: false,
      reason: 'revoked',
      message: 'Este dispositivo fue revocado. Contacte al administrador.',
    });
    expect(content.title).toBe('Dispositivo revocado');
    expect(content.showRetry).toBe(true);
    expect(content.showActivateLink).toBe(false);
  });

  it('mapea not_enrolled con enlace a activación', () => {
    const content = getDeviceBindingScreenContent({
      ok: false,
      reason: 'not_enrolled',
      message: 'Este teléfono no está activado.',
    });
    expect(content.showActivateLink).toBe(true);
    expect(content.showRetry).toBe(false);
  });
});
