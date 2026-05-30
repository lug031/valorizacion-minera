import {
  buildInterFetchStatusHint,
  buildInterMetalHint,
  hasValidInterSyncMetadata,
} from '../../src/presentation/utils/inter-sync-hint';
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
  it('no muestra hint si nunca hubo metadata INTER válida', () => {
    expect(buildInterMetalHint('gold', '4400.00', baseMeta, null)).toBeNull();
    expect(buildInterMetalHint('gold', '4400.00', baseMeta, '2026-05-27T10:00:00.000Z')).toBeNull();
  });

  it('no considera válida metadata solo con source reference (restaurado)', () => {
    expect(
      hasValidInterSyncMetadata({
        ...baseMeta,
        interGoldSource: 'reference',
        interSilverSource: 'reference',
      })
    ).toBe(false);
  });

  it('muestra detalle cuando hay fetchedAt de auto-actualización', () => {
    const meta = {
      ...baseMeta,
      interGoldSource: 'minted-metal-lbma',
      interGoldFetchedAt: '2026-05-28T12:00:00.000Z',
      interFetchStatus: 'ok',
    };
    expect(hasValidInterSyncMetadata(meta)).toBe(true);
    const hint = buildInterMetalHint('gold', '4426.00', meta, '2026-05-28T11:00:00.000Z');
    expect(hint?.title).toBe('Último valor sincronizado');
    expect(hint?.valueLine).toContain('4426.00');
  });

  it('no muestra hint con lastSyncAt si no hay metadata INTER válida', () => {
    const hint = buildInterMetalHint(
      'silver',
      '74.35',
      { ...baseMeta, interSilverSource: 'manual' },
      '2026-05-27T10:00:00.000Z'
    );
    expect(hint).toBeNull();
  });

  it('expone error de fetch web solo con metadata INTER válida', () => {
    expect(
      buildInterFetchStatusHint({
        ...baseMeta,
        interFetchStatus: 'failed',
        interFetchError: 'Proveedor no disponible',
      })
    ).toBeNull();

    const msg = buildInterFetchStatusHint({
      ...baseMeta,
      interGoldFetchedAt: '2026-05-28T12:00:00.000Z',
      interFetchStatus: 'failed',
      interFetchError: 'Proveedor no disponible',
    });
    expect(msg).toContain('falló');
    expect(msg).toContain('Proveedor no disponible');
  });
});
