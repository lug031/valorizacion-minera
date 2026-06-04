import { FALLBACK_MATERIAL_TYPES } from '../../src/domain/constants/expected-mat-codes';
import { getActiveMaterialTypesForUi } from '../../src/presentation/utils/material-type-options';

describe('getActiveMaterialTypesForUi', () => {
  it('usa fallback con etiquetas oficiales cuando el store está vacío', () => {
    const options = getActiveMaterialTypesForUi([], false);
    expect(options.map((m) => m.code)).toEqual(['MOC', 'MSC', 'MOLL', 'MSLL']);
    expect(options[0]?.label).toBe('Mineral Oxido Crudo');
  });

  it('ordena por sortOrder, filtra inactivos y acepta códigos nuevos', () => {
    const options = getActiveMaterialTypesForUi(
      [
        { id: '2', code: 'MOC', label: 'Mineral Oxido Crudo', isActive: true, sortOrder: 2 },
        { id: 'x', code: 'MOS', label: 'Mineral Oxido Seco', isActive: true, sortOrder: 9 },
        { id: '1', code: 'MSC', label: 'MSC', isActive: false, sortOrder: 1 },
        { id: '3', code: 'MSLL', label: 'MSLL', isActive: true, sortOrder: 3 },
      ],
      true
    );
    expect(options.map((m) => m.code)).toEqual(['MOC', 'MSLL', 'MOS']);
  });

  it('fallback oficial tiene 4 códigos', () => {
    expect(FALLBACK_MATERIAL_TYPES).toHaveLength(4);
  });
});
