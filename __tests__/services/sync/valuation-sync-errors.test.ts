import {
  parseValuationSyncError,
  valuationSyncErrorMessage,
} from '../../../src/services/sync/valuation-sync-errors';

describe('valuation-sync-errors', () => {
  it('parses coded server errors', () => {
    const parsed = parseValuationSyncError(new Error('[DEVICE_BLOCKED] Dispositivo bloqueado'));
    expect(parsed.code).toBe('DEVICE_BLOCKED');
    expect(valuationSyncErrorMessage(parsed.code, parsed.message)).toContain('autorizado');
  });

  it('maps network failures', () => {
    const parsed = parseValuationSyncError(new Error('Network request failed'));
    expect(parsed.code).toBe('NETWORK_ERROR');
  });
});
