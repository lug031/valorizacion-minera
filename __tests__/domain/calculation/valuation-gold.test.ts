import { calculateValorAuPerTms } from '../../../src/domain/calculation/valuation-gold';

describe('calculateValorAuPerTms', () => {
  it('aplica orden exacto Excel y redondea solo al final', () => {
    // ((((2000-50)*1.0*0.9)-135)*1)-10-5-0 = 1605
    const result = calculateValorAuPerTms({
      interGold: 2000,
      rcGold: 50,
      leyGoldOzTc: 1.0,
      recPercent: 90,
      maquila: 135,
      factor: 1,
      consumos: 10,
      flete: 5,
      otrosCostos: 0,
    });
    expect(result.toFixed(2)).toBe('1605.00');
  });

  it('trata otros costos vacíos como 0', () => {
    const result = calculateValorAuPerTms({
      interGold: 100,
      rcGold: 0,
      leyGoldOzTc: 1,
      recPercent: 100,
      maquila: 0,
      factor: 1,
      consumos: 0,
      flete: 0,
      otrosCostos: null,
    });
    expect(result.toFixed(2)).toBe('100.00');
  });

  it('no usa float nativo erróneo en cadena', () => {
    const result = calculateValorAuPerTms({
      interGold: '0.1',
      rcGold: '0',
      leyGoldOzTc: '3',
      recPercent: 100,
      maquila: '0',
      factor: '0.3',
      consumos: '0',
      flete: '0',
    });
    expect(result.toFixed(2)).toBe('0.09');
  });
});
