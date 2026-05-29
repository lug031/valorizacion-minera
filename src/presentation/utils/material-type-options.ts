import {
  EXPECTED_MAT_CODES,
  FALLBACK_MATERIAL_TYPES,
  isExpectedMatCode,
} from '../../domain/constants/expected-mat-codes';
import type { MaterialType } from '../../domain/models/config';

/** MAT activos válidos ordenados por sortOrder; fallback offline sin MOP. */
export function getActiveMaterialTypesForUi(
  materialTypes: MaterialType[],
  hydrated: boolean
): MaterialType[] {
  const source = materialTypes.length > 0 || hydrated ? materialTypes : [...FALLBACK_MATERIAL_TYPES];

  return source
    .filter((m) => m.isActive && isExpectedMatCode(m.code))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
}

export function getExpectedMatCodesForUi(
  materialTypes: MaterialType[],
  hydrated: boolean
): readonly string[] {
  const codes = getActiveMaterialTypesForUi(materialTypes, hydrated).map((m) => m.code);
  return codes.length > 0 ? codes : EXPECTED_MAT_CODES;
}
