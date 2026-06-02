import { resolveHistorialSendUi } from '../../src/presentation/utils/historial-send-ui';
import type { ValuationSyncQueueCounts } from '../../src/data/repositories/valuation-sync-queue';

const empty: ValuationSyncQueueCounts = {
  pending: 0,
  syncing: 0,
  error: 0,
  skippedNoCloudUser: 0,
};

describe('resolveHistorialSendUi', () => {
  it('sin cola no muestra nada', () => {
    expect(resolveHistorialSendUi(empty, true)).toBeNull();
  });

  it('online solo pending: sin franja (envío automático)', () => {
    expect(resolveHistorialSendUi({ ...empty, pending: 1 }, true)).toBeNull();
    expect(resolveHistorialSendUi({ ...empty, syncing: 1 }, true)).toBeNull();
  });

  it('offline con pending: aviso sin botón', () => {
    const ui = resolveHistorialSendUi({ ...empty, pending: 2 }, false);
    expect(ui?.showSendButton).toBe(false);
    expect(ui?.bannerText).toContain('Se sincronizarán solas al tener internet');
  });

  it('online con error: reintentar', () => {
    const ui = resolveHistorialSendUi({ ...empty, pending: 1, error: 1 }, true);
    expect(ui?.showSendButton).toBe(true);
    expect(ui?.sendButtonLabel).toBe('Reintentar sincronización');
  });

  it('solo omitidas: sin botón', () => {
    const ui = resolveHistorialSendUi(
      { pending: 2, syncing: 0, error: 0, skippedNoCloudUser: 2 },
      true
    );
    expect(ui?.showSendButton).toBe(false);
  });
});
