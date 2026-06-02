import { formatValuationSyncAlert } from '../../src/services/sync/format-valuation-sync-alert';
import type { SyncValuationsResult } from '../../src/services/sync/sync-valuations.service';

const emptyResult: SyncValuationsResult = {
  attempted: 0,
  synced: 0,
  skipped: 0,
  failed: 0,
  recoveredOrphans: 0,
  errors: [],
};

describe('formatValuationSyncAlert', () => {
  it('explica sincronización automática cuando no hay pendientes tras el intento', () => {
    const msg = formatValuationSyncAlert(emptyResult, {
      queueAfter: { pending: 0, syncing: 0, error: 0, skippedNoCloudUser: 0 },
    });
    expect(msg.message).toContain('sincronización automática');
  });

  it('indica problema de conexión si siguen pendientes sin intentos', () => {
    const msg = formatValuationSyncAlert(emptyResult, {
      queueAfter: { pending: 1, syncing: 0, error: 0, skippedNoCloudUser: 0 },
    });
    expect(msg.message).toContain('conexión');
  });

  it('aclara omitidas por usuario local antiguo', () => {
    const msg = formatValuationSyncAlert({
      ...emptyResult,
      attempted: 2,
      skipped: 2,
      synced: 0,
    });
    expect(msg.message).toContain('admin de prueba');
  });
});
