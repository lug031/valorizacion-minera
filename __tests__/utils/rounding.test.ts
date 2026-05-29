import { roundDown, roundHalfUp } from '../../src/utils/rounding';

describe('roundDown (REDONDEAR.MENOS)', () => {
  it('trunca hacia abajo a 3 decimales', () => {
    expect(roundDown(14.85, 3).toFixed(3)).toBe('14.850');
  });

  it('no redondea hacia arriba en el cuarto decimal', () => {
    expect(roundDown(14.8599, 3).toFixed(3)).toBe('14.859');
  });
});

describe('roundHalfUp', () => {
  it('redondea .5 hacia arriba', () => {
    expect(roundHalfUp(2.345, 2).toFixed(2)).toBe('2.35');
  });
});
