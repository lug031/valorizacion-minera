import Decimal from 'decimal.js';
import type { ValuationCalculationResult, ScenarioCommercialParams } from '../../../domain/models/calculation';
import { normalizeGradeToOzTc } from '../../../domain/calculation/grade-conversion';
import type { ValuationSnapshot } from '../../../domain/models/valuation';
import type { ValuationDraft } from '../../../domain/models/draft';
import {
  formatPdfMoney,
  formatPdfDecimal,
  formatPdfPercent,
  formatPdfDate,
  formatPdfDateTime,
} from '../formatters';
import { DEFAULT_PDF_BRANDING, PDF_TEMPLATE_VERSION } from '../pdf-config';
import type { ValuationPdfViewModel } from '../types/valuation-pdf-view-model';

export interface ValuationPdfMeta {
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName?: string | null;
  observaciones?: string | null;
  operatorName: string;
}

function getPrimaryScenarioIndex(snapshot: ValuationSnapshot): number {
  const idx = snapshot.activeScenarioIndex ?? 0;
  return Math.max(0, Math.min(idx, snapshot.scenarios.length - 1));
}

function multiplyMoney(perTms: string, tms: string): string {
  const v = new Decimal(perTms || 0).mul(tms || 0);
  return formatPdfMoney(v.toFixed(2));
}

function buildMetalRows(
  params: ScenarioCommercialParams,
  result: ValuationCalculationResult,
  lot: ValuationSnapshot['lot']
): ValuationPdfViewModel['metalRows'] {
  const scenarioResult =
    result.scenarios.find((r) => r.label === params.label) ?? result.scenarios[0];
  const tms = result.tms;
  const leyGold = normalizeGradeToOzTc(lot.goldGrade, lot.goldGradeUnit);
  const leySilver = normalizeGradeToOzTc(lot.silverGrade, lot.silverGradeUnit);
  const auPerTms = scenarioResult?.valorAuPerTms ?? '0';
  const agPerTms = scenarioResult?.valorAgPerTms ?? '0';

  return [
    {
      metal: 'Au',
      leyOzTc: formatPdfDecimal(leyGold.toString(), 3),
      recPercent: formatPdfPercent(lot.recPercentGold),
      maquila: formatPdfDecimal(params.maquila, 0),
      proteccion: formatPdfMoney(params.rcGold),
      interUs: formatPdfMoney(params.interGold),
      precioTms: formatPdfMoney(auPerTms),
      importeUs: multiplyMoney(auPerTms, tms),
    },
    {
      metal: 'Ag',
      leyOzTc: formatPdfDecimal(leySilver.toString(), 3),
      recPercent: formatPdfPercent(lot.recPercentSilver),
      maquila: '—',
      proteccion: formatPdfMoney(params.rcSilver),
      interUs: formatPdfMoney(params.interSilver),
      precioTms: formatPdfMoney(agPerTms),
      importeUs: multiplyMoney(agPerTms, tms),
    },
  ];
}

function buildSummary(
  params: ScenarioCommercialParams,
  result: ValuationCalculationResult,
  tmh: string
): ValuationPdfViewModel['summary'] {
  const scenarioResult =
    result.scenarios.find((r) => r.label === params.label) ?? result.scenarios[0];
  const tms = result.tms;
  const valorFinalPerTms = scenarioResult?.valorFinalPerTms ?? '0';
  const valorCompraTotal = scenarioResult?.valorCompraTotal ?? '0';
  const consumosTotal = new Decimal(params.consumos || 0).mul(tms || 0);
  const otrosTotal = new Decimal(params.otrosCostos ?? '0').mul(tmh || 0);

  return {
    totalAuAg: formatPdfMoney(valorCompraTotal),
    valorPorTmsAuAg: formatPdfMoney(valorFinalPerTms),
    consumosPerTms: formatPdfMoney(params.consumos),
    consumosTotal: formatPdfMoney(consumosTotal.toFixed(2)),
    costosAsignadosPerTmh:
      parseFloat(params.otrosCostos ?? '0') > 0
        ? formatPdfMoney(params.otrosCostos ?? '0')
        : '—',
    costosAsignadosTotal:
      parseFloat(params.otrosCostos ?? '0') > 0
        ? formatPdfMoney(otrosTotal.toFixed(2))
        : '—',
    totalMenosConsumos: formatPdfMoney(valorCompraTotal),
    valorFinalPorTms: formatPdfMoney(valorFinalPerTms),
  };
}

export function buildPdfViewModelFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta,
  branding = DEFAULT_PDF_BRANDING
): ValuationPdfViewModel {
  const idx = getPrimaryScenarioIndex(snapshot);
  const params = snapshot.scenarios[idx];
  const lot = snapshot.lot;

  return {
    lotTitle: `LOTE N° ${meta.code}`,
    loteCode: meta.code,
    fecha: formatPdfDate(meta.fecha),
    operatorName: meta.operatorName,
    materialTypeCode: meta.materialTypeCode,
    providerName: meta.providerName ?? null,
    tmh: formatPdfDecimal(lot.tmh, 3),
    h2oPercent: formatPdfPercent(lot.h2oPercent),
    tms: formatPdfDecimal(snapshot.results.tms, 3),
    metalRows: buildMetalRows(params, snapshot.results, lot),
    summary: buildSummary(params, snapshot.results, lot.tmh),
    observaciones: meta.observaciones?.trim() ?? '',
    generatedAt: formatPdfDateTime(new Date().toISOString()),
    formulaVersion: snapshot.formulaVersion,
    templateVersion: PDF_TEMPLATE_VERSION,
    disclaimer: branding.disclaimer,
    calculatedAt: formatPdfDateTime(snapshot.calculatedAt),
  };
}

export function buildPdfViewModelFromDraft(
  draft: ValuationDraft,
  results: ValuationCalculationResult,
  meta: Pick<ValuationPdfMeta, 'operatorName'> & { observaciones?: string },
  branding = DEFAULT_PDF_BRANDING
): ValuationPdfViewModel {
  const idx = Math.min(draft.activeScenarioIndex, draft.scenarios.length - 1);
  const scenariosParams = draft.scenarios.map((s) => ({
    label: s.label,
    name: s.name,
    maquila: s.maquila,
    rcGold: s.rcGold,
    rcSilver: s.rcSilver,
    consumos: s.consumos,
    flete: s.flete,
    interGold: s.interGold,
    interSilver: s.interSilver,
    factor: draft.factor,
    otrosCostos: s.otrosCostos,
  }));

  const snapshot: ValuationSnapshot = {
    formulaVersion: results.formulaVersion,
    lot: {
      tmh: draft.tmh,
      h2oPercent: draft.h2oPercent,
      goldGrade: draft.goldGradeOzTc,
      goldGradeUnit: 'oz_tc',
      silverGrade: draft.silverGradeOzTc,
      silverGradeUnit: 'oz_tc',
      recPercentGold: draft.recPercentGold,
      recPercentSilver: draft.recPercentSilver,
    },
    scenarios: scenariosParams,
    maquilaRangesUsed: [],
    appSettingsUsed: { factor: draft.factor },
    results,
    calculatedAt: new Date().toISOString(),
    activeScenarioIndex: idx,
  };

  return buildPdfViewModelFromSnapshot(
    snapshot,
    {
      code: draft.code,
      fecha: draft.fecha,
      materialTypeCode: draft.materialTypeCode,
      providerName: draft.providerName,
      observaciones: meta.observaciones ?? draft.observaciones,
      operatorName: meta.operatorName,
    },
    branding
  );
}
