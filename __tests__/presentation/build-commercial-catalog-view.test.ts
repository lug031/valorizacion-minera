import { buildCommercialCatalogView, countCatalogChanges } from '../../src/presentation/utils/build-commercial-catalog-view';
import type { ConfigSyncSnapshot } from '../../src/services/sync/config-sync-snapshot';

const snapshot: ConfigSyncSnapshot = {
  appSettings: {
    factor: '1.05',
    defaultConsumos: '10',
    defaultFlete: '5',
    defaultRcGold: '1800',
    defaultRcSilver: '22',
    defaultRecPercentGold: '95',
    defaultRecPercentSilver: '90',
    defaultInterGold: '4420.12',
    defaultInterSilver: '30.5',
    updatedAt: '2026-05-31T12:00:00.000Z',
  },
  materialTypes: [
    { code: 'MSC', label: 'MSC', isActive: true, updatedAt: null },
    { code: 'MOC', label: 'MOC', isActive: true, updatedAt: null },
  ],
  maquilaRanges: [
    {
      id: '1',
      minLeyOzTc: '0',
      maxLeyOzTc: '1',
      maquila: '120',
      isActive: true,
      updatedAt: null,
    },
  ],
};

describe('buildCommercialCatalogView', () => {
  it('lista todos los valores iniciales y marca solo los cambiados', () => {
    const sections = buildCommercialCatalogView(snapshot, {
      syncAt: '2026-05-31T12:05:00.000Z',
      entries: [
        {
          id: 'settings.defaultInterGold',
          category: 'valores_iniciales',
          label: 'INTER oro',
          previousValue: 'US$ 4419.45',
          newValue: 'US$ 4420.12',
          previousRecordedAt: '2026-05-01T10:00:00.000Z',
          newRecordedAt: '2026-05-31T12:00:00.000Z',
          syncAt: '2026-05-31T12:05:00.000Z',
        },
      ],
    });

    const settings = sections.find((s) => s.category === 'valores_iniciales');
    expect(settings?.rows.length).toBe(9);
    expect(countCatalogChanges(sections)).toBe(1);

    const inter = settings?.rows.find((r) => r.id === 'settings.defaultInterGold');
    expect(inter?.status).toBe('changed');

    const factor = settings?.rows.find((r) => r.id === 'settings.factor');
    expect(factor?.status).toBe('unchanged');
    expect(factor?.currentValue).toBe('1.05');
  });
});
