import { buildInterFetchStatusHint, buildInterMetalHint } from '../../src/presentation/utils/inter-sync-hint';
import type { InterSyncMetadata } from '../../src/presentation/store/settings-store';

const baseMeta: InterSyncMetadata = {
  interGoldSource: null,
  interSilverSource: null,
  interGoldFetchedAt: null,
  interSilverFetchedAt: null,
  interFetchStatus: null,
  interFetchError: null,
};

describe('inter-sync-hint', () => {
  it('no muestra hint si nunca hubo sync', () => {
    expect(buildInterMetalHint('gold', '4400.00', baseMeta, null)).toBeNull();
  });

  it('muestra detalle cuando hay fetchedAt de auto-actualización', () => {
    const hint = buildInterMetalHint(
      'gold',
      '4426.00',
      {
        ...baseMeta,
        interGoldSource: 'minted-metal-lbma',
        interGoldFetchedAt: '2026-05-28T12:00:00.000Z',
        interFetchStatus: 'ok',
      },
      '2026-05-28T11:00:00.000Z'
    );
    expect(hint?.mode).toBe('synced_detail');
    expect(hint?.title).toBe('Último valor sincronizado');
    expect(hint?.valueLine).toContain('4426.00');
  });

  it('muestra offline_cached con lastSyncAt sin fetchedAt', () => {
    const hint = buildInterMetalHint(
      'silver',
      '74.35',
      { ...baseMeta, interSilverSource: 'manual' },
      '2026-05-27T10:00:00.000Z'
    );
    expect(hint?.mode).toBe('offline_cached');
    expect(hint?.title).toBe('Usando último valor sincronizado');
  });

  it('expone error de fetch web sin ser agresivo en el texto base', () => {
    const msg = buildInterFetchStatusHint({
      ...baseMeta,
      interFetchStatus: 'failed',
      interFetchError: 'Proveedor no disponible',
    });
    expect(msg).toContain('falló');
    expect(msg).toContain('Proveedor no disponible');
  });
});
