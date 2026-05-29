import type { FormulaVersion } from '../constants/formula';
import type { GradeUnit, ScenarioLabel } from './enums';

/** Datos de lote compartidos entre escenarios. */
export interface LotInput {
  tmh: string;
  h2oPercent: string;
  goldGrade: string;
  goldGradeUnit: GradeUnit;
  silverGrade: string;
  silverGradeUnit: GradeUnit;
  /** REC oro en UI: 90, 85 — no decimal. */
  recPercentGold: string;
  /** REC plata en UI: 90, 85 — no decimal. */
  recPercentSilver: string;
}

/** Parámetros comerciales por escenario (pueden diferir). */
export interface ScenarioCommercialParams {
  label: ScenarioLabel;
  name: string;
  maquila: string;
  rcGold: string;
  rcSilver: string;
  consumos: string;
  flete: string;
  interGold: string;
  interSilver: string;
  factor: string;
  otrosCostos?: string | null;
  recPercentGold?: string | null;
  recPercentSilver?: string | null;
}

export interface CalculationInput {
  lot: LotInput;
  scenario: ScenarioCommercialParams;
  leyGoldOzTc?: string;
  leySilverOzTc?: string;
}

export interface ScenarioCalculationResult {
  label: ScenarioLabel;
  name: string;
  valorAuPerTms: string;
  valorAgPerTms: string;
  valorFinalPerTms: string;
  valorCompraTotal: string;
  suggestedMaquila: string | null;
  maquilaUsed: string;
  recFactorGold: string;
  recFactorSilver: string;
}

export interface ValuationCalculationResult {
  formulaVersion: FormulaVersion;
  tms: string;
  leyGoldOzTc: string;
  leySilverOzTc: string;
  recPercentGold: string;
  recPercentSilver: string;
  recFactorGold: string;
  recFactorSilver: string;
  scenarios: ScenarioCalculationResult[];
}
