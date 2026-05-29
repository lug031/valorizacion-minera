import { recPercentToFactor } from '../../../src/domain/calculation/rec-factor';

describe('recPercentToFactor', () => {
  it('convierte 90 → 0.9', () => {
    expect(recPercentToFactor(90).toString()).toBe('0.9');
  });

  it('convierte 85 → 0.85', () => {
    expect(recPercentToFactor(85).toString()).toBe('0.85');
  });
});
