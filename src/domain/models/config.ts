/** Rango configurable para sugerencia de maquila (ley oro en oz/tc). */
export interface MaquilaRange {
  id?: string;
  minLeyOzTc: string;
  maxLeyOzTc: string;
  maquila: string;
  sortOrder?: number;
  isActive?: boolean;
  updatedAt?: string | null;
}

/** Tipo de material — clasificación; no altera fórmulas en v1. */
export interface MaterialType {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  /** Reservado: defaults por tipo MAT en versiones futuras. */
  metadataJson?: string | null;
  updatedAt?: string | null;
}

export interface Provider {
  id: string;
  name: string;
  isActive: boolean;
}

/** Defaults comerciales por proveedor (precargan formulario). */
export interface ProviderDefaults {
  providerId: string;
  recPercentGold?: string | null;
  recPercentSilver?: string | null;
  rcGold?: string | null;
  rcSilver?: string | null;
  consumos?: string | null;
  flete?: string | null;
  interGold?: string | null;
  interSilver?: string | null;
  factor?: string | null;
}

export interface AppSettings {
  id: string;
  factor: string;
  defaultConsumos?: string | null;
  defaultFlete?: string | null;
  defaultRcGold?: string | null;
  defaultRcSilver?: string | null;
  defaultRecPercentGold?: string | null;
  defaultRecPercentSilver?: string | null;
  defaultInterGold?: string | null;
  defaultInterSilver?: string | null;
  interGoldSource?: string | null;
  interSilverSource?: string | null;
  interGoldFetchedAt?: string | null;
  interSilverFetchedAt?: string | null;
  interFetchStatus?: string | null;
  interFetchError?: string | null;
  updatedAt: string;
}
