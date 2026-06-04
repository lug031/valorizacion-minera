import type { MaterialType } from '../models/config';

/** Catálogo MAT inicial (orden y etiquetas alineados a la web). */
export const DEFAULT_MATERIAL_TYPES_CATALOG = [
  { code: 'MOC', label: 'Mineral Oxido Crudo', sortOrder: 1 },
  { code: 'MSC', label: 'Mineral Sulfuro Crudo', sortOrder: 2 },
  { code: 'MOLL', label: 'Mineral Oxido Llampo', sortOrder: 3 },
  { code: 'MSLL', label: 'Mineral Sulfuro LLampo', sortOrder: 4 },
] as const;

/** Códigos del catálogo de referencia (changelog / fallback offline). */
export const EXPECTED_MAT_CODES = DEFAULT_MATERIAL_TYPES_CATALOG.map((m) => m.code);

export type ExpectedMatCode = (typeof DEFAULT_MATERIAL_TYPES_CATALOG)[number]['code'];

/** Fallback offline si aún no hay catálogo sincronizado en SQLite. */
export const FALLBACK_MATERIAL_TYPES: readonly MaterialType[] = DEFAULT_MATERIAL_TYPES_CATALOG.map(
  (row) => ({
    id: `mat-${row.code.toLowerCase()}`,
    code: row.code,
    label: row.label,
    isActive: true,
    sortOrder: row.sortOrder,
    metadataJson: null,
  })
);

export function isExpectedMatCode(code: string): code is ExpectedMatCode {
  return EXPECTED_MAT_CODES.includes(code.trim().toUpperCase() as ExpectedMatCode);
}
