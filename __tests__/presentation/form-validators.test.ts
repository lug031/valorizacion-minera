import {
  fechaField,
  h2oPercentField,
  isValidIsoDate,
  parseNumericInput,
  requiredNonNegativeNumeric,
} from '../../src/presentation/forms/form-validators';

describe('form-validators', () => {
  it('parseNumericInput acepta coma decimal', () => {
    expect(parseNumericInput('1,5')).toBe(1.5);
  });

  it('rechaza negativos', () => {
    expect(requiredNonNegativeNumeric.safeParse('-1').success).toBe(false);
    expect(requiredNonNegativeNumeric.safeParse('0').success).toBe(true);
  });

  it('H2O no puede ser mayor a 100', () => {
    expect(h2oPercentField.safeParse('101').success).toBe(false);
    expect(h2oPercentField.safeParse('100').success).toBe(true);
  });

  it('valida fecha ISO real', () => {
    expect(isValidIsoDate('2026-05-24')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(fechaField.safeParse('2026-13-01').success).toBe(false);
  });
});
