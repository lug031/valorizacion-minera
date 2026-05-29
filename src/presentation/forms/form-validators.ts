import { z } from 'zod';

export function parseNumericInput(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

export function isValidIsoDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Numérico requerido, no negativo. */
export const requiredNonNegativeNumeric = z
  .string()
  .min(1, 'Requerido')
  .refine((v) => !Number.isNaN(parseNumericInput(v)), 'Número inválido')
  .refine((v) => parseNumericInput(v) >= 0, 'No puede ser negativo');

/** H2O %: 0–100. */
export const h2oPercentField = requiredNonNegativeNumeric.refine(
  (v) => parseNumericInput(v) <= 100,
  'No puede ser mayor a 100'
);

/** Fecha ISO AAAA-MM-DD válida. */
export const fechaField = z
  .string()
  .min(10, 'Requerido')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use formato AAAA-MM-DD')
  .refine(isValidIsoDate, 'Fecha inválida');

/** Numérico opcional; si hay valor, debe ser válido y no negativo. */
export const optionalNonNegativeNumeric = z
  .string()
  .optional()
  .refine(
    (v) => !v || (!Number.isNaN(parseNumericInput(v)) && parseNumericInput(v) >= 0),
    'Número inválido'
  );
