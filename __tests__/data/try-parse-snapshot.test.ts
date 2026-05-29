import { tryParseSnapshot } from '../../src/data/repositories/valuation-repository';

describe('tryParseSnapshot', () => {
  it('devuelve null con JSON inválido', () => {
    expect(tryParseSnapshot('{bad json')).toBeNull();
  });

  it('devuelve null si faltan resultados', () => {
    expect(tryParseSnapshot(JSON.stringify({ scenarios: [] }))).toBeNull();
  });

  it('parsea snapshot válido', () => {
    const json = JSON.stringify({
      results: { scenarios: [{ label: 'A', valorCompraTotal: '100' }] },
    });
    expect(tryParseSnapshot(json)?.results.scenarios).toHaveLength(1);
  });
});
