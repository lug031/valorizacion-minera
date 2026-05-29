import { useMemo } from 'react';
import type { ValuationCalculationResult } from '../../domain/models/calculation';
import type { ValuationDraft } from '../../domain/models/draft';
import type { ValuationSnapshot } from '../../domain/models/valuation';
import { canUseScenarioComparison, primaryScenarioIndex } from '../../config/scenario-comparison-access';

export interface ExportScenarioOption {
  label: string;
  name: string;
  total: string;
}

export function buildExportScenarioOptions(
  scenarioDrafts: Array<{ label: string; name: string }>,
  results: ValuationCalculationResult
): ExportScenarioOption[] {
  return scenarioDrafts.map((sc) => {
    const row =
      results.scenarios.find((r) => r.label === sc.label) ?? results.scenarios[0];
    return {
      label: sc.label,
      name: sc.name,
      total: row?.valorCompraTotal ?? '0',
    };
  });
}

function filterExportOptionsForV1<T extends ExportScenarioOption>(
  options: T[],
  activeIndex: number
): T[] {
  if (canUseScenarioComparison() || options.length <= 1) return options;
  const idx = primaryScenarioIndex(activeIndex, options.length);
  return [options[idx]];
}

export function buildExportOptionsFromDraft(
  draft: ValuationDraft,
  results: ValuationCalculationResult
): ExportScenarioOption[] {
  const options = buildExportScenarioOptions(draft.scenarios, results);
  return filterExportOptionsForV1(options, draft.activeScenarioIndex);
}

export function buildExportOptionsFromSnapshot(
  snapshot: ValuationSnapshot
): ExportScenarioOption[] {
  const options = buildExportScenarioOptions(
    snapshot.scenarios.map((s) => ({ label: s.label, name: s.name })),
    snapshot.results
  );
  return filterExportOptionsForV1(options, snapshot.activeScenarioIndex ?? 0);
}

/** Opciones memo-friendly para pantallas de exportación. */
export function useExportScenarioOptions(
  draft: ValuationDraft | null,
  results: ValuationCalculationResult | null
): ExportScenarioOption[] {
  return useMemo(() => {
    if (!draft || !results) return [];
    return buildExportOptionsFromDraft(draft, results);
  }, [draft, results]);
}
