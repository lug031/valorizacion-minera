import {
  formatMaterialTypeButtonLabel,
  getMaterialTypesForValuationPicker,
} from '../../src/presentation/utils/material-type-options';
import type { MaterialType } from '../../src/domain/models/config';

const catalog: MaterialType[] = [
  { id: '1', code: 'MSC', label: 'MSC', isActive: true, sortOrder: 0 },
  { id: '2', code: 'MOC', label: 'MOC', isActive: true, sortOrder: 1 },
];

describe('material type picker en edición', () => {
  it('el menú solo incluye MAT activos del catálogo', () => {
    const options = getMaterialTypesForValuationPicker(catalog, true, 'MOP');
    expect(options.map((m) => m.code)).toEqual(['MSC', 'MOC']);
  });

  it('el botón conserva código histórico fuera de catálogo', () => {
    expect(formatMaterialTypeButtonLabel('MOP', catalog, true)).toBe('MOP (histórico)');
  });
});
