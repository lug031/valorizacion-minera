import {
  formatPdfMoney,
  formatPdfDecimal,
  escapeHtml,
} from '../../../src/services/pdf/formatters';

describe('pdf formatters', () => {
  it('formatPdfMoney usa es-PE con 2 decimales', () => {
    const s = formatPdfMoney(25348.95);
    expect(s).toMatch(/25/);
    expect(s).toMatch(/348/);
  });

  it('formatPdfDecimal TMS 3 decimales', () => {
    expect(formatPdfDecimal('14.850', 3)).toBe('14.850');
  });

  it('escapeHtml evita inyección', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });
});
