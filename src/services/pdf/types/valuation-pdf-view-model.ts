/** Fila Au/Ag del formato preliquidación (tabla por lote). */
export interface ValuationPdfMetalRow {
  metal: 'Au' | 'Ag';
  leyOzTc: string;
  recPercent: string;
  maquila: string;
  proteccion: string;
  interUs: string;
  precioTms: string;
  importeUs: string;
}

export interface ValuationPdfLotSummary {
  totalAuAg: string;
  valorPorTmsAuAg: string;
  consumosPerTms: string;
  consumosTotal: string;
  costosAsignadosPerTmh: string;
  costosAsignadosTotal: string;
  totalMenosConsumos: string;
  valorFinalPorTms: string;
}

/** View-model de una sola valorización (escenario principal). */
export interface ValuationPdfViewModel {
  lotTitle: string;
  loteCode: string;
  fecha: string;
  operatorName: string;
  materialTypeCode: string;
  providerName: string | null;
  tmh: string;
  h2oPercent: string;
  tms: string;
  metalRows: ValuationPdfMetalRow[];
  summary: ValuationPdfLotSummary;
  observaciones: string;
  generatedAt: string;
  formulaVersion: string;
  templateVersion: string;
  disclaimer: string;
  calculatedAt: string;
}
