import { buildCatalogValueHint } from '../../src/presentation/utils/catalog-value-hint';

describe('buildCatalogValueHint', () => {
  it('devuelve hint cuando el valor guardado difiere del maestro', () => {
    const hint = buildCatalogValueHint('4419.45', '4420.12', {
      label: 'INTER oro',
      valuePrefix: 'US$',
    });
    expect(hint?.valueLine).toBe('US$ 4420.12');
    expect(hint?.title).toContain('INTER oro');
  });

  it('no devuelve hint cuando los valores coinciden', () => {
    expect(
      buildCatalogValueHint('100', '100', { label: 'Factor comercial' })
    ).toBeNull();
  });
});
