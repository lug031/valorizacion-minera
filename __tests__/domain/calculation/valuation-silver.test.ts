import { calculateValorAgPerTms } from '../../../src/domain/calculation/valuation-silver';

describe('calculateValorAgPerTms', () => {
  it('no descuenta maquila ni consumos ni flete', () => {
    // (25-1)*5*0.85*1 = 102
    const result = calculateValorAgPerTms({
      interSilver: 25,
      rcSilver: 1,
      leySilverOzTc: 5,
      recPercent: 85,
      factor: 1,
    });
    expect(result.toFixed(2)).toBe('102.00');
  });

  it('RC plata es parámetro configurable', () => {
    const result = calculateValorAgPerTms({
      interSilver: 30,
      rcSilver: 5,
      leySilverOzTc: 2,
      recPercent: 90,
      factor: 1,
    });
    // (30-5)*2*0.9 = 45
    expect(result.toFixed(2)).toBe('45.00');
  });
});
