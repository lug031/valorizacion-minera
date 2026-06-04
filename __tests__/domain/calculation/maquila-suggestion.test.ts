import { DEFAULT_MAQUILA_RANGES } from '../../../src/domain/constants/default-maquila-ranges';
import { suggestMaquila } from '../../../src/domain/calculation/maquila-suggestion';

describe('suggestMaquila', () => {
  const ranges = DEFAULT_MAQUILA_RANGES;

  it('0.250 oz/tc → 90', () => {
    expect(suggestMaquila('0.250', ranges)).toBe('90');
  });

  it('0.350 oz/tc → 95', () => {
    expect(suggestMaquila('0.350', ranges)).toBe('95');
  });

  it('1.000 oz/tc → 135', () => {
    expect(suggestMaquila('1.000', ranges)).toBe('135');
  });

  it('1.901 oz/tc → 190 (rango superior)', () => {
    expect(suggestMaquila('1.901', ranges)).toBe('190');
  });

  it('2.500 oz/tc → 190 (ley > 1.901)', () => {
    expect(suggestMaquila('2.500', ranges)).toBe('190');
  });

  it('1.902 oz/tc → 190 (ley > 1.901)', () => {
    expect(suggestMaquila('1.902', ranges)).toBe('190');
  });

  it('1.012 oz/tc → 140 (rango 1.001-1.100)', () => {
    expect(suggestMaquila('1.012', ranges)).toBe('140');
  });

  it('ignora rangos inactivos', () => {
    const custom = [
      { minLeyOzTc: '0.200', maxLeyOzTc: '0.300', maquila: '90', isActive: false },
      { minLeyOzTc: '0.301', maxLeyOzTc: '0.400', maquila: '95', isActive: true },
    ];
    expect(suggestMaquila('0.250', custom)).toBeNull();
    expect(suggestMaquila('0.350', custom)).toBe('95');
  });
});
