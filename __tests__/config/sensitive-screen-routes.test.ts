import { isValuationSensitiveRoute } from '../../src/config/sensitive-screen-routes';

describe('isValuationSensitiveRoute', () => {
  it('incluye flujo valorizacion', () => {
    expect(isValuationSensitiveRoute(['(app)', 'valorizacion', 'nueva'])).toBe(true);
    expect(isValuationSensitiveRoute(['(app)', 'valorizacion', 'resultado'])).toBe(true);
  });

  it('incluye historial y detalle', () => {
    expect(isValuationSensitiveRoute(['(app)', 'historial'])).toBe(true);
    expect(isValuationSensitiveRoute(['(app)', 'historial', 'abc-123'])).toBe(true);
  });

  it('excluye dashboard, configuracion y sync', () => {
    expect(isValuationSensitiveRoute(['(app)', 'dashboard'])).toBe(false);
    expect(isValuationSensitiveRoute(['(app)', 'configuracion'])).toBe(false);
    expect(isValuationSensitiveRoute(['(app)', 'sincronizar-configuracion'])).toBe(false);
  });

  it('excluye auth', () => {
    expect(isValuationSensitiveRoute(['(auth)', 'login'])).toBe(false);
    expect(isValuationSensitiveRoute(['(auth)', 'activate'])).toBe(false);
  });
});
