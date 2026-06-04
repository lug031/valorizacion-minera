import {
  DEFAULT_MATERIAL_TYPES_CATALOG,
  FALLBACK_MATERIAL_TYPES,
} from '../../domain/constants/expected-mat-codes';
import type { MaterialType } from '../../domain/models/config';

/** MAT activos del catálogo sincronizado; fallback solo antes del primer hydrate. */
export function getActiveMaterialTypesForUi(
  materialTypes: MaterialType[],
  hydrated: boolean
): MaterialType[] {
  const source = materialTypes.length > 0 || hydrated ? materialTypes : [...FALLBACK_MATERIAL_TYPES];

  return source
    .filter((m) => m.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
}

export function getExpectedMatCodesForUi(
  materialTypes: MaterialType[],
  hydrated: boolean
): readonly string[] {
  return getActiveMaterialTypesForUi(materialTypes, hydrated).map((m) => m.code);
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
  _hydrated: boolean
): string {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return 'MAT';
  const match = materialTypes.find((m) => m.code.toUpperCase() === normalized);
  if (match?.isActive) return match.code;
  const fallback = DEFAULT_MATERIAL_TYPES_CATALOG.find((m) => m.code === normalized);
  if (fallback) return fallback.code;
  return `${normalized} (histórico)`;
}
