import { FALLBACK_MATERIAL_TYPES, EXPECTED_MAT_CODES } from '../../src/domain/constants/expected-mat-codes';
import { getActiveMaterialTypesForUi } from '../../src/presentation/utils/material-type-options';

describe('getActiveMaterialTypesForUi', () => {
  it('usa fallback sin MOP cuando el store está vacío', () => {
    const options = getActiveMaterialTypesForUi([], false);
    expect(options.map((m) => m.code)).toEqual([...EXPECTED_MAT_CODES]);
    expect(options.some((m) => m.code === 'MOP')).toBe(false);
  });

  it('ordena por sortOrder y filtra inactivos', () => {
    const options = getActiveMaterialTypesForUi(
      [
        { id: '2', code: 'MOC', label: 'MOC', isActive: true, sortOrder: 2 },
        { id: 'x', code: 'MOP', label: 'MOP', isActive: true, sortOrder: 9 },
        { id: '1', code: 'MSC', label: 'MSC', isActive: false, sortOrder: 1 },
        { id: '3', code: 'MSLL', label: 'MSLL', isActive: true, sortOrder: 3 },
      ],
      true
    );
    expect(options.map((m) => m.code)).toEqual(['MOC', 'MSLL']);
    expect(options.some((m) => m.code === 'MOP')).toBe(false);
  });

  it('fallback oficial tiene 4 códigos', () => {
    expect(FALLBACK_MATERIAL_TYPES).toHaveLength(4);
  });
});
