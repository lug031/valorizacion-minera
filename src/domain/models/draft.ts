import type { ScenarioLabel } from './enums';

export interface ScenarioDraft {
  label: ScenarioLabel;
  name: string;
  maquila: string;
  maquilaManuallyEdited: boolean;
  rcGold: string;
  rcSilver: string;
  consumos: string;
  flete: string;
  interGold: string;
  interSilver: string;
  otrosCostos: string;
}

export interface ValuationDraft {
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName: string;
  observaciones: string;
  /** Factor comercial compartido entre escenarios. */
  factor: string;
  tmh: string;
  h2oPercent: string;
  goldGradeOzTc: string;
  silverGradeOzTc: string;
  recPercentGold: string;
  recPercentSilver: string;
  /** Comparación A/B/C opcional; por defecto solo escenario principal. */
  comparisonEnabled: boolean;
  activeScenarioIndex: number;
  scenarios: ScenarioDraft[];
}

type LegacyScenario = ScenarioDraft & { factor?: string };

/** Compatibilidad con borradores/snapshots antiguos. */
export function normalizeValuationDraft(draft: ValuationDraft): ValuationDraft {
  const legacyScenarios = draft.scenarios as LegacyScenario[];
  const factor = draft.factor ?? legacyScenarios[0]?.factor ?? '1';
  const scenarios: ScenarioDraft[] = legacyScenarios.map(
    ({ factor: _f, ...rest }) => rest
  );
  const comparisonEnabled =
    draft.comparisonEnabled ?? draft.scenarios.length > 1;
  return { ...draft, factor, comparisonEnabled, scenarios };
}
