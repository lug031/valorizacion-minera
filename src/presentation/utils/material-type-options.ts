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

/**
 * Opciones del menú MAT al editar: solo activos en catálogo actual.
 * El código ya guardado en la cotización se muestra en el botón aunque ya no esté en catálogo.
 */
export function getMaterialTypesForValuationPicker(
  materialTypes: MaterialType[],
  hydrated: boolean,
  selectedCode: string | undefined | null
): MaterialType[] {
  const active = getActiveMaterialTypesForUi(materialTypes, hydrated);
  const code = selectedCode?.trim().toUpperCase();
  if (!code || active.some((m) => m.code.toUpperCase() === code)) {
    return active;
  }
  return active;
}

/** Etiqueta del botón MAT: conserva código histórico aunque ya no esté en catálogo. */
export function formatMaterialTypeButtonLabel(
  code: string | undefined | null,
  materialTypes: MaterialType[],
  hydrated: boolean
): string {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return 'MAT';
  const active = getActiveMaterialTypesForUi(materialTypes, hydrated);
  if (active.some((m) => m.code.toUpperCase() === normalized)) {
    return normalized;
  }
  return `${normalized} (histórico)`;
}
