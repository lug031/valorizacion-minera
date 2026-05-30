import {
  buildSyncRecordRows,
  syncRecordsCardSubtitle,
  syncRecordsCardTitle,
} from '../../src/presentation/utils/sync-records-display';
import type { SyncMetadata } from '../../src/services/sync/sync-config.types';

const baseMetadata: SyncMetadata = {
  key: 'config',
  lastSyncAt: '2026-05-28T12:00:00.000Z',
  status: 'success',
  errorMessage: null,
  bundleVersion: 'v1',
  validationIssues: [],
  recordsMaterialTypes: 4,
  recordsMaquilaRanges: 18,
  recordsProviders: 3,
  recordsProviderDefaults: 2,
  recordsAppSettings: 1,
  maxUpdatedAtMaterialTypes: null,
  maxUpdatedAtMaquilaRanges: null,
  maxUpdatedAtProviders: null,
  maxUpdatedAtProviderDefaults: null,
  maxUpdatedAtAppSettings: null,
  rawChecksum: null,
};

describe('sync-records-display', () => {
  it('expone filas en español con hints para proveedores y config global', () => {
    const rows = buildSyncRecordRows(baseMetadata);
    expect(rows).toHaveLength(5);
    expect(rows.find((r) => r.label.includes('Proveedores'))?.value).toBe(3);
    expect(rows.find((r) => r.label.includes('Defaults por proveedor'))?.value).toBe(2);
    expect(rows.find((r) => r.label.includes('Configuración comercial'))?.hint).toContain('Registro maestro');
  });

  it('usa título distinto según estado de sync', () => {
    expect(syncRecordsCardTitle('success')).toBe('Registros aplicados');
    expect(syncRecordsCardTitle('error')).toBe('Registros recibidos de la nube');
    expect(syncRecordsCardSubtitle('success')).toContain('SQLite');
  });
});
