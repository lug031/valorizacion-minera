import { useCallback, useState } from 'react';
import type { ValuationSnapshot } from '../../domain/models/valuation';
import type { ValuationDraft } from '../../domain/models/draft';
import type { ValuationCalculationResult } from '../../domain/models/calculation';
import type { ValuationPdfMeta } from '../../services/pdf/builders/valuation-pdf-builder';
import {
  exportAndShareValuationPdfFromDraft,
  exportAndShareValuationPdfFromSnapshot,
  exportValuationPdfFromDraft,
  exportValuationPdfFromSnapshot,
  sharePdfFile,
} from '../../services/pdf/pdf-service';

export function useExportValuationPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo generar el PDF';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportFromSnapshot = useCallback(
    async (
      snapshot: ValuationSnapshot,
      meta: ValuationPdfMeta,
      share = true,
      scenarioIndex?: number
    ) => {
      const snap =
        scenarioIndex != null
          ? { ...snapshot, activeScenarioIndex: scenarioIndex }
          : snapshot;
      return run(async () => {
        if (share) {
          return exportAndShareValuationPdfFromSnapshot(snap, meta);
        }
        const result = await exportValuationPdfFromSnapshot(snap, meta);
        return result;
      });
    },
    [run]
  );

  const exportFromDraft = useCallback(
    async (
      draft: ValuationDraft,
      results: ValuationCalculationResult,
      operatorName: string,
      share = true,
      scenarioIndex?: number
    ) => {
      const draftForExport =
        scenarioIndex != null
          ? { ...draft, activeScenarioIndex: scenarioIndex }
          : draft;
      return run(async () => {
        if (share) {
          return exportAndShareValuationPdfFromDraft(
            draftForExport,
            results,
            operatorName
          );
        }
        return exportValuationPdfFromDraft(draftForExport, results, operatorName);
      });
    },
    [run]
  );

  const shareExisting = useCallback(
    async (uri: string, fileName: string) => {
      return run(async () => {
        await sharePdfFile(uri, fileName);
        return { uri, fileName };
      });
    },
    [run]
  );

  return {
    loading,
    error,
    exportFromSnapshot,
    exportFromDraft,
    shareExisting,
    clearError: () => setError(null),
  };
}
