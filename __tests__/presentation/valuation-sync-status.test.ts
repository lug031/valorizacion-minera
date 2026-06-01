import {
  valuationPanelSyncColor,
  valuationPanelSyncLabel,
} from '../../src/presentation/utils/valuation-sync-status';

describe('valuation-sync-status', () => {
  it('labels panel sync states', () => {
    expect(valuationPanelSyncLabel('synced')).toBe('Enviada al panel');
    expect(valuationPanelSyncLabel('pending')).toBe('Pendiente de envío');
    expect(valuationPanelSyncLabel('error')).toBe('Error al enviar');
  });

  it('uses distinct colors for error and synced', () => {
    expect(valuationPanelSyncColor('synced')).not.toBe(valuationPanelSyncColor('error'));
  });
});
