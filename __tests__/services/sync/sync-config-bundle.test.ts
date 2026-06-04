import {
  assertPublishedConfigBundle,
  BundleValidationError,
  validatePublishedConfigBundle,
} from '../../../src/services/sync/sync-config-bundle';
import type { SyncCloudPayload } from '../../../src/services/sync/sync-config.schemas';

function basePayload(overrides: Partial<SyncCloudPayload> = {}): SyncCloudPayload {
  return {
    materialTypes: [
      { id: '1', code: 'MSC', label: 'MSC', isActive: true, sortOrder: 1 },
      { id: '2', code: 'MOC', label: 'MOC', isActive: true, sortOrder: 2 },
      { id: '3', code: 'MSLL', label: 'MSLL', isActive: true, sortOrder: 3 },
      { id: '4', code: 'MOLL', label: 'MOLL', isActive: true, sortOrder: 4 },
    ],
    maquilaRanges: [
      {
        id: 'm1',
        minLeyOzTc: '2.000',
        maxLeyOzTc: '3.000',
        maquila: '250',
        isActive: true,
        sortOrder: 0,
      },
    ],
    providers: [{ id: 'p1', name: 'Prov', isActive: true }],
    providerDefaults: [{ id: 'd1', providerId: 'p1' }],
    appSettings: [
      {
        id: 's1',
        settingsKey: 'default',
        factor: '1',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('validatePublishedConfigBundle', () => {
  it('acepta bundle completo', () => {
    const result = validatePublishedConfigBundle(basePayload());
    expect(result.isValid).toBe(true);
    expect(result.bundleVersion).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('rechaza MAT vacío', () => {
    const result = validatePublishedConfigBundle(basePayload({ materialTypes: [] }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes('MaterialType'))).toBe(true);
  });

  it('acepta MAT con códigos distintos al catálogo inicial si hay al menos uno activo', () => {
    const result = validatePublishedConfigBundle(
      basePayload({
        materialTypes: [
          { id: '1', code: 'MOC', label: 'MOC', isActive: true, sortOrder: 1 },
          { id: '2', code: 'MSC', label: 'MSC', isActive: false, sortOrder: 2 },
        ],
      })
    );
    expect(result.isValid).toBe(true);
  });

  it('rechaza maquila vacía', () => {
    const result = validatePublishedConfigBundle(basePayload({ maquilaRanges: [] }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes('MaquilaRange'))).toBe(true);
  });

  it('rechaza AppSettings default inválido', () => {
    const result = validatePublishedConfigBundle(basePayload({ appSettings: [] }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes('AppSettings'))).toBe(true);
  });

  it('rechaza ProviderDefaults huérfano', () => {
    const result = validatePublishedConfigBundle(
      basePayload({ providerDefaults: [{ id: 'd1', providerId: 'missing' }] })
    );
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes('huérfano'))).toBe(true);
  });

  it('lanza BundleValidationError', () => {
    expect(() => assertPublishedConfigBundle(basePayload({ materialTypes: [] }))).toThrow(
      BundleValidationError
    );
  });
});
