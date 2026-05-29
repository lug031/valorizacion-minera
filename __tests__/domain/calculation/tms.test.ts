import { calculateTms } from '../../../src/domain/calculation/tms';

describe('calculateTms', () => {
  it('replica ejemplo Excel: TMH=15, H2O=1 → TMS=14.850', () => {
    const tms = calculateTms(15, 1);
    expect(tms).not.toBeNull();
    expect(tms!.toFixed(3)).toBe('14.850');
  });

  it('usa REDONDEAR.MENOS, no round normal', () => {
    const tms = calculateTms('10.1234', '2.5');
    const expected = 10.1234 - (10.1234 * 2.5) / 100;
    expect(tms!.toNumber()).toBeLessThanOrEqual(expected);
  });

  it('retorna null si TMH negativo', () => {
    expect(calculateTms(-1, 1)).toBeNull();
  });
});
