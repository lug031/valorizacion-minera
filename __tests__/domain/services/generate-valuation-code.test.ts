import { generateValuationCode } from '../../../src/domain/services/generate-valuation-code';

describe('generateValuationCode', () => {
  it('genera formato VAL-YYYYMMDD-HHmmss-XXXX', () => {
    const code = generateValuationCode(new Date('2026-05-24T21:30:15'));
    expect(code).toMatch(/^VAL-20260524-213015-[0-9A-F]{4}$/);
  });
});
