export type ConfigChangeCategory = 'valores_iniciales' | 'tipo_mat' | 'maquila';

export interface ConfigChangeEntry {
  id: string;
  category: ConfigChangeCategory;
  label: string;
  previousValue: string | null;
  newValue: string | null;
  /** Fecha del valor/registro anterior en este dispositivo (o en web si se conoce). */
  previousRecordedAt: string | null;
  /** Fecha del valor nuevo según registro en web / SQLite local. */
  newRecordedAt: string | null;
  /** Momento en que este dispositivo aplicó la actualización. */
  syncAt: string;
}

export interface ConfigSyncChangelog {
  syncAt: string;
  entries: ConfigChangeEntry[];
}
