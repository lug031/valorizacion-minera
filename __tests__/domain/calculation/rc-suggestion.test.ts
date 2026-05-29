import { suggestRcGold } from '../../../src/domain/calculation/rc-suggestion';

describe('suggestRcGold', () => {
  it('devuelve RC fijo de negocio (60)', () => {
    expect(suggestRcGold('1.012')).toBe('60');
    expect(suggestRcGold('2.5')).toBe('60');
  });
});
