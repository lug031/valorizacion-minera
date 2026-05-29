import {
  gramsToOzTc,
  normalizeGradeToOzTc,
  ozTcToGrams,
} from '../../../src/domain/calculation/grade-conversion';

describe('grade conversion', () => {
  it('convierte gramos a onzas con factor 34.28571', () => {
    const oz = gramsToOzTc(34.28571);
    expect(oz.toFixed(5)).toBe('1.00000');
  });

  it('convierte onzas a gramos', () => {
    const gr = ozTcToGrams(1);
    expect(gr.toFixed(5)).toBe('34.28571');
  });

  it('normaliza gr_tm a oz_tc', () => {
    const oz = normalizeGradeToOzTc('34.28571', 'gr_tm');
    expect(oz.toFixed(5)).toBe('1.00000');
  });

  it('mantiene oz_tc sin conversión', () => {
    const oz = normalizeGradeToOzTc('1.5', 'oz_tc');
    expect(oz.toFixed(2)).toBe('1.50');
  });
});
