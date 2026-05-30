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
  it('expone solo filas operativas sin detalle técnico', () => {
    const rows = buildSyncRecordRows(baseMetadata);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.label)).toEqual(['Materiales', 'Rangos de maquila', 'Proveedores']);
    expect(rows.find((r) => r.label === 'Proveedores')?.value).toBe(3);
  });

  it('usa subtítulo breve según estado de sync', () => {
    expect(syncRecordsCardTitle('success')).toBe('Registros aplicados');
    expect(syncRecordsCardTitle('error')).toBe('Último intento de sincronización');
    expect(syncRecordsCardSubtitle('success')).toContain('valores comerciales');
    expect(syncRecordsCardSubtitle('idle')).toBeNull();
  });
});
