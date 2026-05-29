import type { MaquilaRange } from '../models/config';

/**
 * Tabla inicial de sugerencia de maquila (ley oro oz/tc).
 * Editable vía configuración/SQLite; no hardcodear en UI.
 */
export const DEFAULT_MAQUILA_RANGES: readonly MaquilaRange[] = [
  { minLeyOzTc: '0.200', maxLeyOzTc: '0.300', maquila: '90' },
  { minLeyOzTc: '0.301', maxLeyOzTc: '0.400', maquila: '95' },
  { minLeyOzTc: '0.401', maxLeyOzTc: '0.500', maquila: '110' },
  { minLeyOzTc: '0.501', maxLeyOzTc: '0.600', maquila: '115' },
  { minLeyOzTc: '0.601', maxLeyOzTc: '0.700', maquila: '120' },
  { minLeyOzTc: '0.701', maxLeyOzTc: '0.800', maquila: '125' },
  { minLeyOzTc: '0.801', maxLeyOzTc: '0.900', maquila: '130' },
  { minLeyOzTc: '0.901', maxLeyOzTc: '1.000', maquila: '135' },
  { minLeyOzTc: '1.001', maxLeyOzTc: '1.100', maquila: '140' },
  { minLeyOzTc: '1.101', maxLeyOzTc: '1.200', maquila: '145' },
  { minLeyOzTc: '1.201', maxLeyOzTc: '1.300', maquila: '150' },
  { minLeyOzTc: '1.301', maxLeyOzTc: '1.400', maquila: '155' },
  { minLeyOzTc: '1.401', maxLeyOzTc: '1.500', maquila: '160' },
  { minLeyOzTc: '1.501', maxLeyOzTc: '1.600', maquila: '165' },
  { minLeyOzTc: '1.601', maxLeyOzTc: '1.700', maquila: '170' },
  { minLeyOzTc: '1.701', maxLeyOzTc: '1.800', maquila: '175' },
  { minLeyOzTc: '1.801', maxLeyOzTc: '1.900', maquila: '180' },
  { minLeyOzTc: '1.901', maxLeyOzTc: '2.000', maquila: '190' },
] as const;

/** Si ley > este umbral (oz/tc), sugerir maquila máxima. */
export const MAQUILA_LEY_MAX_THRESHOLD = '1.901';

export const MAQUILA_ABOVE_MAX_SUGGESTION = '190';
