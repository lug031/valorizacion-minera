import { syncCloudPayloadSchema } from '../../../src/services/sync/sync-config.schemas';

describe('syncCloudPayloadSchema INTER metadata', () => {
  it('acepta campos metadata INTER opcionales en AppSettings', () => {
    const parsed = syncCloudPayloadSchema.parse({
      materialTypes: [],
      maquilaRanges: [],
      providers: [],
      providerDefaults: [],
      appSettings: [
        {
          id: 's1',
          settingsKey: 'default',
          factor: '1.10231',
          defaultInterGold: '4426.00',
          defaultInterSilver: '74.35',
          interGoldSource: 'minted-metal-lbma',
          interSilverSource: 'minted-metal-lbma',
          interGoldFetchedAt: '2026-05-28T12:00:00.000Z',
          interSilverFetchedAt: '2026-05-28T12:00:00.000Z',
          interFetchStatus: 'ok',
          interFetchError: null,
        },
      ],
    });

    expect(parsed.appSettings[0].interFetchStatus).toBe('ok');
  });
});
