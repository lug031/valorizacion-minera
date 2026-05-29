import { Decimal, toDecimal } from '../../utils/decimal';
import { roundHalfUp } from '../../utils/rounding';
import { FORMULA_VERSION } from '../constants/formula';
import type { MaquilaRange } from '../models/config';
import type {
  CalculationInput,
  LotInput,
  ScenarioCalculationResult,
  ScenarioCommercialParams,
  ValuationCalculationResult,
} from '../models/calculation';
import { tryNormalizeGradeToOzTc } from './grade-conversion';
import { suggestMaquila } from './maquila-suggestion';
import { recPercentToFactor, tryRecPercentToFactor } from './rec-factor';
import { calculateTms } from './tms';
import { calculateValorAgPerTms } from './valuation-silver';
import { calculateValorAuPerTms } from './valuation-gold';

const MONEY_DECIMAL_PLACES = 2;

function resolveRecGold(lot: LotInput, scenario: ScenarioCommercialParams): string {
  const v = scenario.recPercentGold?.trim();
  return v ? v : lot.recPercentGold;
}

function resolveRecSilver(lot: LotInput, scenario: ScenarioCommercialParams): string {
  const v = scenario.recPercentSilver?.trim();
  return v ? v : lot.recPercentSilver;
}

function resolveOtrosCostos(scenario: ScenarioCommercialParams): string {
  const v = scenario.otrosCostos;
  if (v == null || v === '') return '0';
  return v;
}

export function calculateScenario(
  lot: LotInput,
  scenario: ScenarioCommercialParams,
  tms: Decimal,
  leyGoldOzTc: Decimal,
  leySilverOzTc: Decimal,
  maquilaRanges: readonly MaquilaRange[]
): ScenarioCalculationResult {
  const recGold = resolveRecGold(lot, scenario);
  const recSilver = resolveRecSilver(lot, scenario);
  const recFactorGold = recPercentToFactor(recGold);
  const recFactorSilver = recPercentToFactor(recSilver);
  const suggestedMaquila = suggestMaquila(leyGoldOzTc, maquilaRanges);
  const maquilaTrimmed = scenario.maquila?.trim();
  const maquilaUsed = maquilaTrimmed || suggestedMaquila || '0';

  const valorAu = calculateValorAuPerTms({
    interGold: scenario.interGold,
    rcGold: scenario.rcGold,
    leyGoldOzTc,
    recPercent: recGold,
    maquila: maquilaUsed,
    factor: scenario.factor,
    consumos: scenario.consumos,
    flete: scenario.flete,
    otrosCostos: resolveOtrosCostos(scenario),
  });

  const valorAg = calculateValorAgPerTms({
    interSilver: scenario.interSilver,
    rcSilver: scenario.rcSilver,
    leySilverOzTc,
    recPercent: recSilver,
    factor: scenario.factor,
  });

  const valorFinalRaw = valorAu.add(valorAg);
  const valorFinalPerTms = roundHalfUp(valorFinalRaw, MONEY_DECIMAL_PLACES);
  const valorCompraTotal = roundHalfUp(
    valorFinalPerTms.mul(tms),
    MONEY_DECIMAL_PLACES
  );

  return {
    label: scenario.label,
    name: scenario.name,
    valorAuPerTms: valorAu.toFixed(MONEY_DECIMAL_PLACES),
    valorAgPerTms: valorAg.toFixed(MONEY_DECIMAL_PLACES),
    valorFinalPerTms: valorFinalPerTms.toFixed(MONEY_DECIMAL_PLACES),
    valorCompraTotal: valorCompraTotal.toFixed(MONEY_DECIMAL_PLACES),
    suggestedMaquila,
    maquilaUsed,
    recFactorGold: recFactorGold.toFixed(4),
    recFactorSilver: recFactorSilver.toFixed(4),
  };
}

export function calculateLotBase(lot: LotInput): {
  tms: Decimal;
  leyGoldOzTc: Decimal;
  leySilverOzTc: Decimal;
} | null {
  const tms = calculateTms(lot.tmh, lot.h2oPercent);
  if (tms == null) return null;

  const leyGoldOzTc = tryNormalizeGradeToOzTc(lot.goldGrade, lot.goldGradeUnit);
  const leySilverOzTc = tryNormalizeGradeToOzTc(lot.silverGrade, lot.silverGradeUnit);
  if (!leyGoldOzTc || !leySilverOzTc) return null;

  return { tms, leyGoldOzTc, leySilverOzTc };
}

export function calculateValuation(
  lot: LotInput,
  scenarios: readonly ScenarioCommercialParams[],
  maquilaRanges: readonly MaquilaRange[]
): ValuationCalculationResult | null {
  const base = calculateLotBase(lot);
  if (base == null) return null;

  const recFactorGold = tryRecPercentToFactor(lot.recPercentGold);
  const recFactorSilver = tryRecPercentToFactor(lot.recPercentSilver);
  if (!recFactorGold || !recFactorSilver) return null;

  const scenarioResults = scenarios.map((scenario) =>
    calculateScenario(
      lot,
      scenario,
      base.tms,
      base.leyGoldOzTc,
      base.leySilverOzTc,
      maquilaRanges
    )
  );

  return {
    formulaVersion: FORMULA_VERSION,
    tms: base.tms.toFixed(3),
    leyGoldOzTc: base.leyGoldOzTc.toFixed(6),
    leySilverOzTc: base.leySilverOzTc.toFixed(6),
    recPercentGold: lot.recPercentGold,
    recPercentSilver: lot.recPercentSilver,
    recFactorGold: recFactorGold.toFixed(4),
    recFactorSilver: recFactorSilver.toFixed(4),
    scenarios: scenarioResults,
  };
}

export function calculateSingleScenario(
  input: CalculationInput,
  maquilaRanges: readonly MaquilaRange[]
): ScenarioCalculationResult | null {
  const base = calculateLotBase(input.lot);
  if (base == null) return null;

  const leyGold = input.leyGoldOzTc
    ? toDecimal(input.leyGoldOzTc)
    : base.leyGoldOzTc;
  const leySilver = input.leySilverOzTc
    ? toDecimal(input.leySilverOzTc)
    : base.leySilverOzTc;

  return calculateScenario(
    input.lot,
    input.scenario,
    base.tms,
    leyGold,
    leySilver,
    maquilaRanges
  );
}
