import Decimal from 'decimal.js';

/** Configuración global para cálculos monetarios (evitar errores de float nativo). */
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/** Parsea número o null si vacío/inválido (sin lanzar DecimalError). */
export function tryToDecimal(
  value: number | string | Decimal | null | undefined
): Decimal | null {
  if (value instanceof Decimal) return value.isFinite() ? value : null;
  if (value == null) return null;
  const normalized = String(value).trim().replace(',', '.');
  if (normalized === '' || normalized === '-' || normalized === '+' || normalized === '.') {
    return null;
  }
  try {
    const d = new Decimal(normalized);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** Para parámetros comerciales: vacío → 0 (evita DecimalError en formularios). */
export function toDecimalOrZero(
  value: number | string | Decimal | null | undefined
): Decimal {
  if (value instanceof Decimal) return value;
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return new Decimal(0);
  }
  return new Decimal(value);
}

export function toNumber(value: Decimal): number {
  return value.toNumber();
}
