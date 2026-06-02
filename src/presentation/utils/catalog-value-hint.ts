import { valuesMatchCommercial } from './commercial-suggestion-ui';

export interface CatalogValueHint {
  title: string;
  valueLine: string;
}

export interface BuildCatalogValueHintOptions {
  /** Etiqueta del campo, p. ej. "INTER oro". */
  label: string;
  /** Prefijo opcional del valor maestro, p. ej. "US$". */
  valuePrefix?: string;
}

/**
 * Hint bajo un campo en edición cuando el valor guardado difiere del maestro local (post-sync web).
 */
export function buildCatalogValueHint(
  currentValue: string | undefined | null,
  masterValue: string | undefined | null,
  options: BuildCatalogValueHintOptions
): CatalogValueHint | null {
  if (valuesMatchCommercial(currentValue, masterValue)) {
    return null;
  }
  const master = String(masterValue ?? '').trim();
  if (!master) return null;

  const prefix = options.valuePrefix?.trim();
  const formatted = prefix ? `${prefix} ${master}` : master;

  return {
    title: `Valor actual (${options.label})`,
    valueLine: formatted,
  };
}
