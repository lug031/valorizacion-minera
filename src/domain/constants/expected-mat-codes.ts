import type { MaterialType } from '../models/config';

/** Tipos MAT válidos según regla de negocio actual (alineado a web/admin). */
export const EXPECTED_MAT_CODES = ['MSC', 'MOC', 'MSLL', 'MOLL'] as const;

export type ExpectedMatCode = (typeof EXPECTED_MAT_CODES)[number];

/** Fallback offline si aún no hay catálogo en SQLite (sin MOP). */
export const FALLBACK_MATERIAL_TYPES: readonly MaterialType[] = EXPECTED_MAT_CODES.map(
  (code, index) => ({
    id: `mat-${code.toLowerCase()}`,
    code,
    label: code,
    isActive: true,
    sortOrder: index + 1,
    metadataJson: null,
  })
);

export function isExpectedMatCode(code: string): code is ExpectedMatCode {
  return (EXPECTED_MAT_CODES as readonly string[]).includes(code.trim().toUpperCase());
}
