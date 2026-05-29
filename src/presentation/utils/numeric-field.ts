import Decimal from 'decimal.js';

/** true si el valor es un número finito usable en el motor (no vacío ni a medias). */
export function isValidNumericField(value: string | number | null | undefined): boolean {
  if (value == null) return false;
  const normalized = String(value).trim().replace(',', '.');
  if (normalized === '' || normalized === '-' || normalized === '+' || normalized === '.') {
    return false;
  }
  try {
    return new Decimal(normalized).isFinite();
  } catch {
    return false;
  }
}

/** Lote + escenario activo listos para calcular (evita DecimalError al borrar un dígito). */
export function isValuationFormReadyForCalculation(values: {
  tmh?: string;
  h2oPercent?: string;
  goldGradeOzTc?: string;
  silverGradeOzTc?: string;
  recPercentGold?: string;
  recPercentSilver?: string;
  factor?: string;
  scenario?: {
    maquila?: string;
    rcGold?: string;
    rcSilver?: string;
    consumos?: string;
    flete?: string;
    interGold?: string;
    interSilver?: string;
    otrosCostos?: string;
  };
}): boolean {
  const sc = values.scenario;
  if (!sc) return false;

  const required = [
    values.tmh,
    values.h2oPercent,
    values.goldGradeOzTc,
    values.silverGradeOzTc,
    values.recPercentGold,
    values.recPercentSilver,
    values.factor,
    sc.maquila,
    sc.rcGold,
    sc.rcSilver,
    sc.consumos,
    sc.flete,
    sc.interGold,
    sc.interSilver,
  ];

  if (!required.every(isValidNumericField)) return false;

  const otros = sc.otrosCostos?.trim();
  if (otros) return isValidNumericField(sc.otrosCostos);

  return true;
}
