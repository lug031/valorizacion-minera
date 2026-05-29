import type { LotInput, ScenarioCommercialParams } from '../../domain/models/calculation';
import type { ValuationDraft, ScenarioDraft } from '../../domain/models/draft';
import type { ValuationFormValues } from './valuation-form-schema';

export function scenarioDraftToFormScenario(s: ScenarioDraft): ValuationFormValues['scenario'] {
  return {
    label: s.label,
    name: s.name,
    maquila: s.maquila,
    rcGold: s.rcGold,
    rcSilver: s.rcSilver,
    consumos: s.consumos,
    flete: s.flete,
    interGold: s.interGold,
    interSilver: s.interSilver,
    otrosCostos: s.otrosCostos,
  };
}

export function formScenarioToDraft(
  scenario: ValuationFormValues['scenario']
): ScenarioDraft {
  return {
    label: scenario.label,
    name: scenario.name,
    maquila: scenario.maquila,
    maquilaManuallyEdited: true,
    rcGold: scenario.rcGold,
    rcSilver: scenario.rcSilver,
    consumos: scenario.consumos,
    flete: scenario.flete,
    interGold: scenario.interGold,
    interSilver: scenario.interSilver,
    otrosCostos: scenario.otrosCostos ?? '0',
  };
}

export function draftToFormValues(draft: ValuationDraft): ValuationFormValues {
  const scenario = draft.scenarios[draft.activeScenarioIndex];
  return {
    code: draft.code,
    fecha: draft.fecha,
    materialTypeCode: draft.materialTypeCode,
    providerName: draft.providerName,
    observaciones: draft.observaciones,
    factor: draft.factor,
    tmh: draft.tmh,
    h2oPercent: draft.h2oPercent,
    goldGradeOzTc: draft.goldGradeOzTc,
    silverGradeOzTc: draft.silverGradeOzTc,
    recPercentGold: draft.recPercentGold,
    recPercentSilver: draft.recPercentSilver,
    activeScenarioIndex: draft.activeScenarioIndex,
    scenario: scenarioDraftToFormScenario(scenario),
  };
}

export function formValuesToLotInput(values: ValuationFormValues): LotInput {
  return {
    tmh: values.tmh,
    h2oPercent: values.h2oPercent,
    goldGrade: values.goldGradeOzTc,
    goldGradeUnit: 'oz_tc',
    silverGrade: values.silverGradeOzTc,
    silverGradeUnit: 'oz_tc',
    recPercentGold: values.recPercentGold,
    recPercentSilver: values.recPercentSilver,
  };
}

export function scenarioDraftToParams(
  s: ScenarioDraft,
  factor: string
): ScenarioCommercialParams {
  return {
    label: s.label,
    name: s.name,
    maquila: s.maquila,
    rcGold: s.rcGold,
    rcSilver: s.rcSilver,
    consumos: s.consumos,
    flete: s.flete,
    interGold: s.interGold,
    interSilver: s.interSilver,
    factor,
    otrosCostos: s.otrosCostos,
  };
}

export function formScenarioToParams(
  scenario: ValuationFormValues['scenario'],
  factor: string
): ScenarioCommercialParams {
  return scenarioDraftToParams(formScenarioToDraft(scenario), factor);
}

/** Construye params de los 3 escenarios aplicando el escenario activo del formulario. */
export function buildAllScenarioParams(
  draft: ValuationDraft,
  activeFormScenario: ValuationFormValues['scenario'] | undefined,
  activeIndex: number,
  factor: string
): ScenarioCommercialParams[] {
  return draft.scenarios.map((sc, idx) => {
    if (idx === activeIndex && activeFormScenario) {
      return formScenarioToParams(activeFormScenario, factor);
    }
    return scenarioDraftToParams(sc, factor);
  });
}

export function draftToLotInput(draft: ValuationDraft): LotInput {
  return {
    tmh: draft.tmh,
    h2oPercent: draft.h2oPercent,
    goldGrade: draft.goldGradeOzTc,
    goldGradeUnit: 'oz_tc',
    silverGrade: draft.silverGradeOzTc,
    silverGradeUnit: 'oz_tc',
    recPercentGold: draft.recPercentGold,
    recPercentSilver: draft.recPercentSilver,
  };
}

export function syncFormValuesToDraft(
  draft: ValuationDraft,
  values: ValuationFormValues
): ValuationDraft {
  const scenarios = [...draft.scenarios];
  const prev = draft.scenarios[values.activeScenarioIndex];
  scenarios[values.activeScenarioIndex] = {
    ...formScenarioToDraft(values.scenario),
    maquilaManuallyEdited: prev?.maquilaManuallyEdited ?? false,
  };

  return {
    ...draft,
    code: values.code,
    fecha: values.fecha,
    materialTypeCode: values.materialTypeCode,
    providerName: values.providerName ?? '',
    observaciones: values.observaciones ?? '',
    factor: values.factor,
    tmh: values.tmh,
    h2oPercent: values.h2oPercent,
    goldGradeOzTc: values.goldGradeOzTc,
    silverGradeOzTc: values.silverGradeOzTc,
    recPercentGold: values.recPercentGold,
    recPercentSilver: values.recPercentSilver,
    activeScenarioIndex: values.activeScenarioIndex,
    scenarios,
  };
}
