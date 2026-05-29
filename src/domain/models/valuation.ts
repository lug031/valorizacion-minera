import type { FormulaVersion } from '../constants/formula';
import type {
  LotInput,
  ScenarioCommercialParams,
  ValuationCalculationResult,
} from './calculation';

/**
 * Snapshot inmutable guardado con la valorización.
 * Si cambia la config global, registros antiguos no se recalculan.
 */
export interface ValuationSnapshot {
  formulaVersion: FormulaVersion;
  lot: LotInput;
  scenarios: ScenarioCommercialParams[];
  maquilaRangesUsed: Array<{
    minLeyOzTc: string;
    maxLeyOzTc: string;
    maquila: string;
  }>;
  appSettingsUsed: {
    factor?: string | null;
  };
  results: ValuationCalculationResult;
  calculatedAt: string;
  /** Escenario seleccionado al guardar (0=A, 1=B, 2=C). */
  activeScenarioIndex?: number;
}

export interface Valuation {
  id: string;
  code: string;
  materialTypeCode: string;
  providerId: string | null;
  providerName: string | null;
  fecha: string;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByUsername: string;
  updatedByUserId: string;
  updatedByUsername: string;
  snapshotJson: string;
}

export interface ValuationListItem {
  id: string;
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName: string | null;
  valorCompraTotalScenarioA: string | null;
  tms: string | null;
  createdAt: string;
  createdByUsername: string;
  updatedByUsername: string;
}
