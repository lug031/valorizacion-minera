import {
  formatSyncQueueBanner,
  formatSyncQueueDiagnostics,
} from '../../src/presentation/utils/format-sync-queue-summary';
import type { ValuationSyncQueueCounts } from '../../src/data/repositories/valuation-sync-queue';

const empty: ValuationSyncQueueCounts = {
  pending: 0,
  syncing: 0,
  error: 0,
  skippedNoCloudUser: 0,
};

describe('formatSyncQueueBanner', () => {
  it('devuelve null sin pendientes', () => {
    expect(formatSyncQueueBanner(empty)).toBeNull();
  });

  it('texto breve en dashboard online', () => {
    expect(formatSyncQueueBanner({ ...empty, pending: 2 }, { context: 'dashboard' })).toBe(
      'Tiene 2 cotizaciones sin enviar al panel. Revise Historial.'
    );
  });

  it('texto offline menciona envío al conectar', () => {
    expect(
      formatSyncQueueBanner({ ...empty, pending: 2 }, { context: 'dashboard', isConnected: false })
    ).toContain('Se subirán solas al tener internet');
  });

  it('texto breve en historial', () => {
    expect(formatSyncQueueBanner({ ...empty, pending: 1 }, { context: 'historial' })).toBe(
      'Tiene 1 cotización sin enviar al panel.'
    );
  });

  it('añade extras cortos', () => {
    const text = formatSyncQueueBanner(
      { pending: 2, syncing: 0, error: 1, skippedNoCloudUser: 2 },
      { context: 'dashboard' }
    );
    expect(text).toContain('3 cotizaciones');
    expect(text).toContain('1 con error');
    expect(text).toContain('actualizar usuarios');
  });
});

describe('formatSyncQueueDiagnostics', () => {
  it('detalle completo en sincronizar', () => {
    expect(formatSyncQueueDiagnostics({ ...empty, pending: 3 })).toContain('Pendientes: 3');
  });
});
