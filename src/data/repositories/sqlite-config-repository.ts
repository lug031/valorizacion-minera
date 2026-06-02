import type { AppSettings, Provider, ProviderDefaults } from '../../domain/models/config';
import type { ConfigRepository } from './config-repository';
import type { SqlExecutor } from '../db/sql-executor';
import { rowToMaquilaRange, type MaquilaRangeRow } from '../mappers/maquila-range-mapper';

interface MaterialTypeRow {
  id: string;
  code: string;
  label: string;
  is_active: number;
  sort_order: number;
  metadata_json: string | null;
  updated_at?: string | null;
}

interface AppSettingsRow {
  id: string;
  factor: string;
  default_consumos: string | null;
  default_flete: string | null;
  default_rc_gold: string | null;
  default_rc_silver: string | null;
  default_rec_percent_gold: string | null;
  default_rec_percent_silver: string | null;
  default_inter_gold: string | null;
  default_inter_silver: string | null;
  inter_gold_source: string | null;
  inter_silver_source: string | null;
  inter_gold_fetched_at: string | null;
  inter_silver_fetched_at: string | null;
  inter_fetch_status: string | null;
  inter_fetch_error: string | null;
  updated_at: string;
}

function mapSettings(row: AppSettingsRow): AppSettings {
  return {
    id: row.id,
    factor: row.factor,
    defaultConsumos: row.default_consumos,
    defaultFlete: row.default_flete,
    defaultRcGold: row.default_rc_gold,
    defaultRcSilver: row.default_rc_silver,
    defaultRecPercentGold: row.default_rec_percent_gold,
    defaultRecPercentSilver: row.default_rec_percent_silver,
    defaultInterGold: row.default_inter_gold,
    defaultInterSilver: row.default_inter_silver,
    interGoldSource: row.inter_gold_source,
    interSilverSource: row.inter_silver_source,
    interGoldFetchedAt: row.inter_gold_fetched_at,
    interSilverFetchedAt: row.inter_silver_fetched_at,
    interFetchStatus: row.inter_fetch_status,
    interFetchError: row.inter_fetch_error,
    updatedAt: row.updated_at,
  };
}

export function createSqliteConfigRepository(getDb: () => Promise<SqlExecutor>): ConfigRepository {
  return {
    async getMaterialTypes(activeOnly = true) {
      const db = await getDb();
      const rows = await db.getAll<MaterialTypeRow>(
        `SELECT * FROM material_types ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order`
      );
      return rows.map((r) => ({
        id: r.id,
        code: r.code,
        label: r.label,
        isActive: r.is_active === 1,
        sortOrder: r.sort_order,
        metadataJson: r.metadata_json,
        updatedAt: r.updated_at ?? null,
      }));
    },

    async getMaquilaRanges(activeOnly = true) {
      const db = await getDb();
      const rows = await db.getAll<MaquilaRangeRow>(
        `SELECT * FROM maquila_ranges ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order`
      );
      return rows.map(rowToMaquilaRange);
    },

    async saveMaquilaRanges(ranges) {
      const db = await getDb();
      await db.withTransaction(async () => {
        await db.run('DELETE FROM maquila_ranges');
        for (let i = 0; i < ranges.length; i++) {
          const r = ranges[i];
          await db.run(
            `INSERT INTO maquila_ranges (id, min_ley_oz_tc, max_ley_oz_tc, maquila, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              r.id ?? `maquila-${i}`,
              r.minLeyOzTc,
              r.maxLeyOzTc,
              r.maquila,
              r.sortOrder ?? i,
              r.isActive === false ? 0 : 1,
            ]
          );
        }
      });
    },

    async getProviders(activeOnly = true) {
      const db = await getDb();
      const rows = await db.getAll<{ id: string; name: string; is_active: number }>(
        `SELECT * FROM providers ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY name`
      );
      return rows.map(
        (r): Provider => ({
          id: r.id,
          name: r.name,
          isActive: r.is_active === 1,
        })
      );
    },

    async getProviderDefaults(providerId) {
      const db = await getDb();
      const row = await db.getFirst<{
        provider_id: string;
        rec_percent_gold: string | null;
        rec_percent_silver: string | null;
        rc_gold: string | null;
        rc_silver: string | null;
        consumos: string | null;
        flete: string | null;
        inter_gold: string | null;
        inter_silver: string | null;
        factor: string | null;
      }>('SELECT * FROM provider_defaults WHERE provider_id = ?', [providerId]);

      if (!row) return null;
      return {
        providerId: row.provider_id,
        recPercentGold: row.rec_percent_gold,
        recPercentSilver: row.rec_percent_silver,
        rcGold: row.rc_gold,
        rcSilver: row.rc_silver,
        consumos: row.consumos,
        flete: row.flete,
        interGold: row.inter_gold,
        interSilver: row.inter_silver,
        factor: row.factor,
      } satisfies ProviderDefaults;
    },

    async getAppSettings() {
      const db = await getDb();
      const row = await db.getFirst<AppSettingsRow>(
        "SELECT * FROM app_settings WHERE id = 'default'"
      );
      return row ? mapSettings(row) : null;
    },

    async saveAppSettings(settings) {
      const db = await getDb();
      await db.run(
        `INSERT OR REPLACE INTO app_settings (
          id, factor, default_consumos, default_flete, default_rc_gold, default_rc_silver,
          default_rec_percent_gold, default_rec_percent_silver, default_inter_gold, default_inter_silver,
          inter_gold_source, inter_silver_source, inter_gold_fetched_at, inter_silver_fetched_at,
          inter_fetch_status, inter_fetch_error, updated_at
        ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.factor,
          settings.defaultConsumos ?? null,
          settings.defaultFlete ?? null,
          settings.defaultRcGold ?? null,
          settings.defaultRcSilver ?? null,
          settings.defaultRecPercentGold ?? null,
          settings.defaultRecPercentSilver ?? null,
          settings.defaultInterGold ?? null,
          settings.defaultInterSilver ?? null,
          settings.interGoldSource ?? null,
          settings.interSilverSource ?? null,
          settings.interGoldFetchedAt ?? null,
          settings.interSilverFetchedAt ?? null,
          settings.interFetchStatus ?? null,
          settings.interFetchError ?? null,
          settings.updatedAt,
        ]
      );
    },
  };
}
