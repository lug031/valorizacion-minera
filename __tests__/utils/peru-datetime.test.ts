import { formatPeruDateTime, PERU_TIMEZONE } from '../../src/utils/peru-datetime';

describe('peru-datetime', () => {
  it('formatea UTC en hora de Lima (UTC-5)', () => {
    // 2026-06-02 01:30 UTC = 2026-06-01 20:30 en Lima
    const formatted = formatPeruDateTime('2026-06-02T01:30:00.000Z');
    expect(formatted).toContain('01/06/2026');
    expect(formatted).toMatch(/(20:30|08:30\s*p)/i);
  });

  it('usa zona America/Lima', () => {
    expect(PERU_TIMEZONE).toBe('America/Lima');
  });
});
