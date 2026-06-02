import type { MaquilaRange } from '../../domain/models/config';

export interface MaquilaRangeRow {
  id: string;
  min_ley_oz_tc: string;
  max_ley_oz_tc: string;
  maquila: string;
  sort_order: number;
  is_active: number;
  updated_at?: string | null;
}

export function rowToMaquilaRange(row: MaquilaRangeRow): MaquilaRange {
  return {
    id: row.id,
    minLeyOzTc: row.min_ley_oz_tc,
    maxLeyOzTc: row.max_ley_oz_tc,
    maquila: row.maquila,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    updatedAt: row.updated_at ?? null,
  };
}
