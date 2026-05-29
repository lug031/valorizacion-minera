import { Decimal, tryToDecimal, toDecimal } from '../../utils/decimal';
import { GRAMS_TO_OZ_FACTOR } from '../constants/formula';
import type { GradeUnit } from '../models/enums';

const factor = () => toDecimal(GRAMS_TO_OZ_FACTOR);

/** gr/tm → oz/tc */
export function gramsToOzTc(grams: string | number): Decimal {
  return toDecimal(grams).div(factor());
}

/** oz/tc → gr/tm */
export function ozTcToGrams(oz: string | number): Decimal {
  return toDecimal(oz).mul(factor());
}

/** Normaliza cualquier ley a oz/tc para el motor. */
export function normalizeGradeToOzTc(value: string | number, unit: GradeUnit): Decimal {
  return unit === 'oz_tc' ? toDecimal(value) : gramsToOzTc(value);
}

/** Como normalizeGradeToOzTc; null si el valor no es numérico (formulario incompleto). */
export function tryNormalizeGradeToOzTc(
  value: string | number,
  unit: GradeUnit
): Decimal | null {
  if (unit === 'oz_tc') {
    return tryToDecimal(value);
  }
  const grams = tryToDecimal(value);
  if (!grams) return null;
  return grams.div(toDecimal(GRAMS_TO_OZ_FACTOR));
}
