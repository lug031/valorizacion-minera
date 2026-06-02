import { buildConfigSyncChangelog } from '../../src/services/sync/build-config-sync-changelog';
import type { ConfigSyncSnapshot } from '../../src/services/sync/config-sync-snapshot';

const emptySnapshot: ConfigSyncSnapshot = {
  appSettings: null,
  materialTypes: [],
  maquilaRanges: [],
};

describe('buildConfigSyncChangelog', () => {
  it('detecta cambio de INTER oro con fechas', () => {
    const before: ConfigSyncSnapshot = {
      ...emptySnapshot,
      appSettings: {
        factor: '1',
        defaultConsumos: null,
        defaultFlete: null,
        defaultRcGold: null,
        defaultRcSilver: null,
        defaultRecPercentGold: null,
        defaultRecPercentSilver: null,
        defaultInterGold: '4419.45',
        defaultInterSilver: '30',
        updatedAt: '2026-05-01T10:00:00.000Z',
      },
    };
    const after: ConfigSyncSnapshot = {
      ...before,
      appSettings: {
        ...before.appSettings!,
        defaultInterGold: '4420.12',
        updatedAt: '2026-05-31T12:00:00.000Z',
      },
    };

    const log = buildConfigSyncChangelog(before, after, '2026-05-31T12:05:00.000Z');
    const inter = log.entries.find((e) => e.label.includes('INTER oro'));
    expect(inter?.previousValue).toContain('4419.45');
    expect(inter?.newValue).toContain('4420.12');
    expect(inter?.previousRecordedAt).toBe('2026-05-01T10:00:00.000Z');
    expect(inter?.newRecordedAt).toBe('2026-05-31T12:00:00.000Z');
  });

  it('detecta tipo MAT agregado', () => {
    const before: ConfigSyncSnapshot = {
      ...emptySnapshot,
      appSettings: {
        factor: '1',
        defaultConsumos: null,
        defaultFlete: null,
        defaultRcGold: null,
        defaultRcSilver: null,
        defaultRecPercentGold: null,
        defaultRecPercentSilver: null,
        defaultInterGold: null,
        defaultInterSilver: null,
        updatedAt: '2026-05-01T10:00:00.000Z',
      },
      materialTypes: [{ code: 'MSC', label: 'MSC', isActive: true, updatedAt: null }],
    };
    const after: ConfigSyncSnapshot = {
      ...before,
      materialTypes: [
        { code: 'MSC', label: 'MSC', isActive: true, updatedAt: '2026-05-31T11:00:00.000Z' },
        { code: 'MOP', label: 'MOP', isActive: true, updatedAt: '2026-05-31T12:00:00.000Z' },
      ],
    };

    const log = buildConfigSyncChangelog(before, after, '2026-05-31T12:00:00.000Z');
    expect(log.entries.some((e) => e.id === 'mat.add.MOP')).toBe(true);
  });
});
