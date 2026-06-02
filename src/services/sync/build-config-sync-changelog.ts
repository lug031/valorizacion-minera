import type {
  ConfigChangeEntry,
  ConfigSyncChangelog,
} from './config-sync-changelog.types';
import type { ConfigSyncSnapshot } from './config-sync-snapshot';

const SETTINGS_FIELDS: Array<{
  key: keyof NonNullable<ConfigSyncSnapshot['appSettings']>;
  label: string;
  format?: (v: string) => string;
}> = [
  { key: 'factor', label: 'Factor comercial' },
  { key: 'defaultRecPercentGold', label: 'REC oro (%)' },
  { key: 'defaultRecPercentSilver', label: 'REC plata (%)' },
  { key: 'defaultRcGold', label: 'RC oro', format: (v) => `US$ ${v}` },
  { key: 'defaultRcSilver', label: 'RC plata', format: (v) => `US$ ${v}` },
  { key: 'defaultConsumos', label: 'Consumos', format: (v) => `US$ ${v}` },
  { key: 'defaultFlete', label: 'Flete', format: (v) => `US$ ${v}` },
  { key: 'defaultInterGold', label: 'INTER oro', format: (v) => `US$ ${v}` },
  { key: 'defaultInterSilver', label: 'INTER plata', format: (v) => `US$ ${v}` },
];

function norm(value: string | null | undefined): string {
  return String(value ?? '').trim().replace(',', '.');
}

function display(
  value: string | null | undefined,
  format?: (v: string) => string
): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return format ? format(raw) : raw;
}

function pushEntry(
  entries: ConfigChangeEntry[],
  entry: Omit<ConfigChangeEntry, 'syncAt'> & { syncAt?: string },
  syncAt: string
): void {
  entries.push({ ...entry, syncAt });
}

export function buildConfigSyncChangelog(
  before: ConfigSyncSnapshot,
  after: ConfigSyncSnapshot,
  syncAt: string
): ConfigSyncChangelog {
  const entries: ConfigChangeEntry[] = [];
  const prevAt = before.appSettings?.updatedAt ?? null;
  const nextAt = after.appSettings?.updatedAt ?? syncAt;

  for (const field of SETTINGS_FIELDS) {
    const prevRaw = before.appSettings?.[field.key] ?? null;
    const nextRaw = after.appSettings?.[field.key] ?? null;
    if (norm(prevRaw) === norm(nextRaw)) continue;

    pushEntry(
      entries,
      {
        id: `settings.${field.key}`,
        category: 'valores_iniciales',
        label: field.label,
        previousValue: display(prevRaw, field.format),
        newValue: display(nextRaw, field.format),
        previousRecordedAt: prevAt,
        newRecordedAt: nextAt,
      },
      syncAt
    );
  }

  const beforeMat = new Map(
    before.materialTypes.map((m) => [m.code.toUpperCase(), m] as const)
  );
  const afterMat = new Map(
    after.materialTypes.map((m) => [m.code.toUpperCase(), m] as const)
  );

  for (const [code, row] of afterMat) {
    const prev = beforeMat.get(code);
    if (!prev) {
      pushEntry(
        entries,
        {
          id: `mat.add.${code}`,
          category: 'tipo_mat',
          label: `Tipo MAT «${code}»`,
          previousValue: null,
          newValue: row.isActive ? 'Agregado (activo)' : 'Agregado (inactivo)',
          previousRecordedAt: null,
          newRecordedAt: row.updatedAt ?? nextAt,
        },
        syncAt
      );
      continue;
    }
    if (prev.isActive !== row.isActive) {
      pushEntry(
        entries,
        {
          id: `mat.status.${code}`,
          category: 'tipo_mat',
          label: `Tipo MAT «${code}»`,
          previousValue: prev.isActive ? 'Activo' : 'Inactivo',
          newValue: row.isActive ? 'Activo' : 'Inactivo',
          previousRecordedAt: prev.updatedAt ?? prevAt,
          newRecordedAt: row.updatedAt ?? nextAt,
        },
        syncAt
      );
    }
  }

  for (const [code, prev] of beforeMat) {
    if (!afterMat.has(code)) {
      pushEntry(
        entries,
        {
          id: `mat.remove.${code}`,
          category: 'tipo_mat',
          label: `Tipo MAT «${code}»`,
          previousValue: prev.isActive ? 'Activo' : 'Inactivo',
          newValue: null,
          previousRecordedAt: prev.updatedAt ?? prevAt,
          newRecordedAt: nextAt,
        },
        syncAt
      );
    }
  }

  const rangeKey = (min: string, max: string) => `${norm(min)}|${norm(max)}`;
  const beforeMaquila = new Map(
    before.maquilaRanges.map((r) => [rangeKey(r.minLeyOzTc, r.maxLeyOzTc), r] as const)
  );
  const afterMaquila = new Map(
    after.maquilaRanges.map((r) => [rangeKey(r.minLeyOzTc, r.maxLeyOzTc), r] as const)
  );

  for (const [key, row] of afterMaquila) {
    const prev = beforeMaquila.get(key);
    const label = `Maquila ${row.minLeyOzTc}–${row.maxLeyOzTc} oz/tc`;
    if (!prev) {
      pushEntry(
        entries,
        {
          id: `maquila.add.${key}`,
          category: 'maquila',
          label,
          previousValue: null,
          newValue: row.maquila,
          previousRecordedAt: null,
          newRecordedAt: row.updatedAt ?? nextAt,
        },
        syncAt
      );
      continue;
    }
    if (norm(prev.maquila) !== norm(row.maquila) || prev.isActive !== row.isActive) {
      pushEntry(
        entries,
        {
          id: `maquila.${key}`,
          category: 'maquila',
          label,
          previousValue: prev.isActive ? prev.maquila : `${prev.maquila} (inactivo)`,
          newValue: row.isActive ? row.maquila : `${row.maquila} (inactivo)`,
          previousRecordedAt: prev.updatedAt ?? prevAt,
          newRecordedAt: row.updatedAt ?? nextAt,
        },
        syncAt
      );
    }
  }

  for (const [key, prev] of beforeMaquila) {
    if (!afterMaquila.has(key)) {
      pushEntry(
        entries,
        {
          id: `maquila.remove.${key}`,
          category: 'maquila',
          label: `Maquila ${prev.minLeyOzTc}–${prev.maxLeyOzTc} oz/tc`,
          previousValue: prev.maquila,
          newValue: null,
          previousRecordedAt: prev.updatedAt ?? prevAt,
          newRecordedAt: nextAt,
        },
        syncAt
      );
    }
  }

  return { syncAt, entries };
}
