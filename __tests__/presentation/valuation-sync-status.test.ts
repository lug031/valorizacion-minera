import {
  valuationPanelSyncColor,
  valuationPanelSyncLabel,
} from '../../src/presentation/utils/valuation-sync-status';

describe('valuationPanelSyncLabel', () => {
  it('labels valuation sync states', () => {
    expect(valuationPanelSyncLabel('synced')).toBe('Sincronizada');
    expect(valuationPanelSyncLabel('pending')).toBe('Pendiente de sincronizar');
    expect(valuationPanelSyncLabel('error')).toBe('Error al sincronizar');
  });

  it('sync colors differ by status', () => {
    expect(valuationPanelSyncColor('synced')).not.toBe(valuationPanelSyncColor('error'));
  });
});
