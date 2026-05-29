import { normalizeGradeToOzTc } from '../../domain/calculation/grade-conversion';
import type { ScenarioCommercialParams } from '../../domain/models/calculation';
import type { ValuationSnapshot } from '../../domain/models/valuation';
import type { ValuationDraft, ScenarioDraft } from '../../domain/models/draft';
import { normalizeValuationDraft } from '../../domain/models/draft';

function paramsToScenarioDraft(params: ScenarioCommercialParams): ScenarioDraft {
  const names: Record<string, string> = {
    A: 'Nuestra propuesta',
    B: 'Competidor',
    C: 'Alternativa',
  };
  return {
    label: params.label,
    name: params.name || names[params.label] || `Escenario ${params.label}`,
    maquila: params.maquila,
    maquilaManuallyEdited: true,
    rcGold: params.rcGold,
    rcSilver: params.rcSilver,
    consumos: params.consumos,
    flete: params.flete,
    interGold: params.interGold,
    interSilver: params.interSilver,
    otrosCostos: params.otrosCostos ?? '0',
  };
}

/**
 * Restaura un draft editable desde snapshot histórico (sin recalcular reglas antiguas).
 */
export function snapshotToDraft(
  snapshot: ValuationSnapshot,
  meta: {
    code: string;
    fecha: string;
    materialTypeCode: string;
    providerName: string;
    observaciones: string;
  }
): ValuationDraft {
  const lot = snapshot.lot;
  const factor =
    snapshot.appSettingsUsed.factor ?? snapshot.scenarios[0]?.factor ?? '1';
  const scenarioParams = snapshot.scenarios;

  const draft: ValuationDraft = {
    code: meta.code,
    fecha: meta.fecha,
    materialTypeCode: meta.materialTypeCode,
    providerName: meta.providerName,
    observaciones: meta.observaciones,
    factor,
    tmh: lot.tmh,
    h2oPercent: lot.h2oPercent,
    goldGradeOzTc: normalizeGradeToOzTc(lot.goldGrade, lot.goldGradeUnit).toFixed(6),
    silverGradeOzTc: normalizeGradeToOzTc(lot.silverGrade, lot.silverGradeUnit).toFixed(6),
    recPercentGold: lot.recPercentGold,
    recPercentSilver: lot.recPercentSilver,
    comparisonEnabled: scenarioParams.length > 1,
    activeScenarioIndex: snapshot.activeScenarioIndex ?? 0,
    scenarios: scenarioParams.map(paramsToScenarioDraft),
  };

  return normalizeValuationDraft(draft);
}
