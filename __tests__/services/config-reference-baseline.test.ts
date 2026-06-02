import { buildConfigSyncChangelog } from '../../src/services/sync/build-config-sync-changelog';
import { mergeConfigSyncChangelog } from '../../src/services/sync/merge-config-sync-changelog';
import {
  getReferenceConfigBaseline,
  isConfigChangeEntryAtReferenceBaseline,
  isConfigSnapshotAtReferenceBaseline,
  pruneConfigChangelog,
} from '../../src/services/sync/config-reference-baseline';
import { maquilaRangeKey } from '../../src/services/sync/commercial-catalog-fields';
import { COTIZADOR_DEFAULTS } from '../../src/domain/constants/cotizador-defaults';
import type { ConfigSyncSnapshot } from '../../src/services/sync/config-sync-snapshot';

describe('config-reference-baseline', () => {
  it('factor en referencia no genera cambio visible tras restaurar', () => {
    const baseline = getReferenceConfigBaseline();
    const modified: ConfigSyncSnapshot = {
      ...baseline,
      appSettings: {
        ...baseline.appSettings!,
        factor: '1.50000',
        updatedAt: '2026-05-15T10:00:00.000Z',
      },
    };
    const restored: ConfigSyncSnapshot = {
      ...baseline,
      appSettings: {
        ...baseline.appSettings!,
        factor: COTIZADOR_DEFAULTS.factor,
        updatedAt: '2026-05-30T10:00:00.000Z',
      },
    };

    const previous = buildConfigSyncChangelog(baseline, modified, '2026-05-15T10:05:00.000Z');
    expect(previous.entries.some((e) => e.id === 'settings.factor')).toBe(true);

    const delta = buildConfigSyncChangelog(modified, restored, '2026-05-30T10:05:00.000Z');
    const merged = mergeConfigSyncChangelog(previous, delta, restored);

    expect(merged.entries.some((e) => e.id === 'settings.factor')).toBe(false);
    expect(
      isConfigChangeEntryAtReferenceBaseline(
        previous.entries.find((e) => e.id === 'settings.factor')!,
        restored
      )
    ).toBe(true);
  });

  it('tipo MAT en estado de referencia no muestra cambio', () => {
    const baseline = getReferenceConfigBaseline();
    const modified: ConfigSyncSnapshot = {
      ...baseline,
      materialTypes: baseline.materialTypes.map((m) =>
        m.code === 'MSC' ? { ...m, isActive: false } : m
      ),
    };
    const restored = baseline;

    const delta = buildConfigSyncChangelog(modified, restored, '2026-05-30T10:05:00.000Z');
    const merged = mergeConfigSyncChangelog(null, delta, restored);

    expect(merged.entries.some((e) => e.id.startsWith('mat.'))).toBe(false);
  });

  it('maquila restaurada a referencia no muestra cambio', () => {
    const baseline = getReferenceConfigBaseline();
    const first = baseline.maquilaRanges[0]!;
    const key = maquilaRangeKey(first.minLeyOzTc, first.maxLeyOzTc);
    const modified: ConfigSyncSnapshot = {
      ...baseline,
      maquilaRanges: baseline.maquilaRanges.map((r, i) =>
        i === 0 ? { ...r, maquila: '999' } : r
      ),
    };

    const delta = buildConfigSyncChangelog(baseline, modified, '2026-05-10T10:05:00.000Z');
    expect(delta.entries.some((e) => e.id === `maquila.${key}`)).toBe(true);

    const restoreDelta = buildConfigSyncChangelog(modified, baseline, '2026-05-30T10:05:00.000Z');
    const merged = mergeConfigSyncChangelog(delta, restoreDelta, baseline);

    expect(merged.entries.some((e) => e.id.startsWith('maquila.'))).toBe(false);
  });

  it('snapshot con etiquetas web y leyes sin ceros es referencia', () => {
    const baseline = getReferenceConfigBaseline();
    const webLike: ConfigSyncSnapshot = {
      appSettings: { ...baseline.appSettings! },
      materialTypes: [
        { code: 'MOC', label: 'Mineral Oxido Crudo', isActive: true, updatedAt: null },
        { code: 'MSC', label: 'Mineral Sulfuro Crudo', isActive: true, updatedAt: null },
        { code: 'MOLL', label: 'Mineral Oxido Llampo', isActive: true, updatedAt: null },
        { code: 'MSLL', label: 'Mineral Sulfuro LLampo', isActive: true, updatedAt: null },
      ],
      maquilaRanges: baseline.maquilaRanges.map((r) => ({
        ...r,
        minLeyOzTc: normLeyWeb(r.minLeyOzTc),
        maxLeyOzTc: normLeyWeb(r.maxLeyOzTc),
      })),
    };

    expect(isConfigSnapshotAtReferenceBaseline(webLike)).toBe(true);
  });

  it('normaliza claves maquila 0.200 y 0.2 como iguales', () => {
    expect(maquilaRangeKey('0.200', '0.300')).toBe(maquilaRangeKey('0.2', '0.3'));
  });

  it('prune elimina changelog cuando todo el catálogo es referencia', () => {
    const baseline = getReferenceConfigBaseline();
    const modified = {
      ...baseline,
      appSettings: { ...baseline.appSettings!, factor: '9.99' },
    };
    const log = buildConfigSyncChangelog(baseline, modified, '2026-05-10T10:05:00.000Z');
    expect(pruneConfigChangelog(log, baseline)?.entries).toEqual([]);
  });
});

function normLeyWeb(value: string): string {
  return String(Number.parseFloat(value));
}
