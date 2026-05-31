import { buildFingerprintRaw } from '../../src/domain/device/device-fingerprint';

describe('device fingerprint', () => {
  it('construye cadena canónica v1 estable', () => {
    const raw = buildFingerprintRaw(
      '11111111-2222-4333-8444-555555555555',
      'com.valorizacion.minera',
      'android',
      'Pixel Test',
      '34'
    );
    expect(raw).toBe(
      'v1|11111111-2222-4333-8444-555555555555|com.valorizacion.minera|android|Pixel Test|34'
    );
  });
});
