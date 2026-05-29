/** Versión actual del motor de fórmulas (snapshot en historial). */
export const FORMULA_VERSION = 'v1' as const;

export type FormulaVersion = typeof FORMULA_VERSION;

/** Factor de conversión gr/tm ↔ oz/tc (Excel). */
export const GRAMS_TO_OZ_FACTOR = '34.28571';

/** REC en UI: 90 = 90%. Motor usa REC/100. */
export const REC_PERCENT_DIVISOR = 100;
