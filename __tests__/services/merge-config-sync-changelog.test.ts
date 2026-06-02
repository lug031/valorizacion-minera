import { buildConfigSyncChangelog } from '../../src/services/sync/build-config-sync-changelog';
import { mergeConfigSyncChangelog } from '../../src/services/sync/merge-config-sync-changelog';
import type { ConfigSyncChangelog } from '../../src/services/sync/config-sync-changelog.types';
import type { ConfigSyncSnapshot } from '../../src/services/sync/config-sync-snapshot';

const baseSettings = {
  factor: '1.10231',
  defaultConsumos: '10',
  defaultFlete: '5',
  defaultRcGold: '1800',
  defaultRcSilver: '22',
  defaultRecPercentGold: '95',
  defaultRecPercentSilver: '90',
  defaultInterGold: '4400',
  defaultInterSilver: '30',
  updatedAt: '2026-05-01T10:00:00.000Z',
};

function snapshot(
  settings: ConfigSyncSnapshot['appSettings'] extends infer A ? NonNullable<A> : never
): ConfigSyncSnapshot {
  return {
    appSettings: settings,
    materialTypes: [],
    maquilaRanges: [],
  };
}

describe('mergeConfigSyncChangelog', () => {
  it('conserva cambios anteriores cuando la sync solo modifica otro campo', () => {
    const sync1Before = snapshot({ ...baseSettings, factor: '1.10231' });
    const sync1After = snapshot({
      ...baseSettings,
      factor: '1.23231',
      updatedAt: '2026-05-10T10:00:00.000Z',
    });
    const factorChange = buildConfigSyncChangelog(
      sync1Before,
      sync1After,
      '2026-05-10T10:05:00.000Z'
    );

    const sync2Before = sync1After;
    const sync2After = snapshot({
      ...sync1After.appSettings!,
      defaultInterGold: '4500',
      updatedAt: '2026-05-20T10:00:00.000Z',
    });
    const interChange = buildConfigSyncChangelog(
      sync2Before,
      sync2After,
      '2026-05-20T10:05:00.000Z'
    );

    const merged = mergeConfigSyncChangelog(factorChange, interChange, sync2After);

    expect(merged.entries).toHaveLength(2);
    expect(merged.entries.find((e) => e.id === 'settings.factor')?.newValue).toBe('1.23231');
    expect(merged.entries.find((e) => e.id === 'settings.defaultInterGold')?.newValue).toBe('US$ 4500');
  });

  it('reemplaza el cambio cuando el mismo campo vuelve a cambiar', () => {
    const previous: ConfigSyncChangelog = {
      syncAt: '2026-05-10T10:05:00.000Z',
      entries: [
        {
          id: 'settings.factor',
          category: 'valores_iniciales',
          label: 'Factor comercial',
          previousValue: '1.10231',
          newValue: '1.23231',
          previousRecordedAt: '2026-05-01T10:00:00.000Z',
          newRecordedAt: '2026-05-10T10:00:00.000Z',
          syncAt: '2026-05-10T10:05:00.000Z',
        },
      ],
    };

    const before = snapshot({ ...baseSettings, factor: '1.23231' });
    const after = snapshot({
      ...baseSettings,
      factor: '1.30000',
      updatedAt: '2026-05-30T10:00:00.000Z',
    });
    const delta = buildConfigSyncChangelog(before, after, '2026-05-30T10:05:00.000Z');
    const merged = mergeConfigSyncChangelog(previous, delta, after);

    const factor = merged.entries.find((e) => e.id === 'settings.factor');
    expect(factor?.previousValue).toBe('1.23231');
    expect(factor?.newValue).toBe('1.30000');
  });

  it('elimina entradas obsoletas si el valor actual ya no coincide', () => {
    const previous: ConfigSyncChangelog = {
      syncAt: '2026-05-10T10:05:00.000Z',
      entries: [
        {
          id: 'settings.factor',
          category: 'valores_iniciales',
          label: 'Factor comercial',
          previousValue: '1.10231',
          newValue: '1.23231',
          previousRecordedAt: null,
          newRecordedAt: '2026-05-10T10:00:00.000Z',
          syncAt: '2026-05-10T10:05:00.000Z',
        },
      ],
    };

    const after = snapshot({ ...baseSettings, factor: '1.99999' });
    const delta: ConfigSyncChangelog = { syncAt: '2026-05-30T10:05:00.000Z', entries: [] };
    const merged = mergeConfigSyncChangelog(previous, delta, after);

    expect(merged.entries).toHaveLength(0);
  });
});
