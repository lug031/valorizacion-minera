import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { ValuationPdfViewModel } from './types/valuation-pdf-view-model';
import { buildPdfViewModelFromSnapshot, buildPdfViewModelFromDraft } from './builders/valuation-pdf-builder';
import { renderValuationPdfHtml } from './templates/valuation-template';
import type { ValuationSnapshot } from '../../domain/models/valuation';
import type { ValuationDraft } from '../../domain/models/draft';
import type { ValuationCalculationResult } from '../../domain/models/calculation';
import type { ValuationPdfMeta } from './builders/valuation-pdf-builder';

export interface GeneratePdfResult {
  uri: string;
  fileName: string;
  htmlLength: number;
}

function sanitizeFileName(code: string): string {
  return code.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 64);
}

/**
 * Genera PDF desde HTML (offline). No recalcula valorización.
 */
export async function generatePdfFromViewModel(
  vm: ValuationPdfViewModel
): Promise<GeneratePdfResult> {
  const html = renderValuationPdfHtml(vm);
  const fileName = `valorizacion-${sanitizeFileName(vm.loteCode)}.pdf`;

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 595,
    height: 842,
  });

  return { uri, fileName, htmlLength: html.length };
}

export async function sharePdfFile(uri: string, fileName: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: fileName,
    UTI: 'com.adobe.pdf',
  });
}

export async function exportValuationPdfFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta
): Promise<GeneratePdfResult> {
  const vm = buildPdfViewModelFromSnapshot(snapshot, meta);
  return generatePdfFromViewModel(vm);
}

export async function exportValuationPdfFromDraft(
  draft: ValuationDraft,
  results: ValuationCalculationResult,
  operatorName: string
): Promise<GeneratePdfResult> {
  const vm = buildPdfViewModelFromDraft(draft, results, { operatorName });
  return generatePdfFromViewModel(vm);
}

export async function exportAndShareValuationPdfFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta
): Promise<GeneratePdfResult> {
  const result = await exportValuationPdfFromSnapshot(snapshot, meta);
  await sharePdfFile(result.uri, result.fileName);
  return result;
}

export async function exportAndShareValuationPdfFromDraft(
  draft: ValuationDraft,
  results: ValuationCalculationResult,
  operatorName: string
): Promise<GeneratePdfResult> {
  const result = await exportValuationPdfFromDraft(draft, results, operatorName);
  await sharePdfFile(result.uri, result.fileName);
  return result;
}

/** Solo HTML (tests / preview). */
export function buildValuationPdfHtmlFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta
): string {
  const vm = buildPdfViewModelFromSnapshot(snapshot, meta);
  return renderValuationPdfHtml(vm);
}
