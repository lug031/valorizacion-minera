import type { Valuation } from '../../../src/domain/models/valuation';
import type { ValuationActor } from '../../../src/domain/models/valuation-actor';
import {
  canDeleteValuation,
  canDuplicateValuation,
  canEditValuation,
} from '../../../src/domain/valuation/valuation-permissions';

const baseValuation: Valuation = {
  id: 'val-1',
  code: 'VAL-001',
  materialTypeCode: 'MSC',
  providerId: null,
  providerName: null,
  fecha: '2026-05-01',
  observaciones: null,
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-01T10:00:00.000Z',
  createdByUserId: 'u-operador',
  createdByUsername: 'operador',
  updatedByUserId: 'u-operador',
  updatedByUsername: 'operador',
  snapshotJson: '{}',
  syncStatus: 'synced',
  syncError: null,
};

const admin: ValuationActor = { id: 'u-admin', username: 'admin', role: 'admin' };
const operador: ValuationActor = { id: 'u-operador', username: 'operador', role: 'operador' };
const otroOperador: ValuationActor = { id: 'u-otro', username: 'otro', role: 'operador' };

describe('valuation permissions', () => {
  it('admin puede editar cualquier valorización', () => {
    expect(canEditValuation(admin, baseValuation)).toBe(true);
  });

  it('operador solo edita las propias', () => {
    expect(canEditValuation(operador, baseValuation)).toBe(true);
    expect(canEditValuation(otroOperador, baseValuation)).toBe(false);
  });

  it('solo admin puede eliminar', () => {
    expect(canDeleteValuation(admin, baseValuation)).toBe(true);
    expect(canDeleteValuation(operador, baseValuation)).toBe(false);
  });

  it('cualquier rol puede duplicar', () => {
    expect(canDuplicateValuation(operador, baseValuation)).toBe(true);
    expect(canDuplicateValuation(otroOperador, baseValuation)).toBe(true);
  });
});
