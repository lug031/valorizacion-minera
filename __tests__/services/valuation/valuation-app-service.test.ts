import { createTestSqlExecutor } from '../../../src/data/db/test-sql-executor';
import { runMigrations } from '../../../src/data/db/migrations';
import { createSqliteValuationRepository } from '../../../src/data/repositories/sqlite-valuation-repository';
import { createValuationAppService } from '../../../src/services/valuation/valuation-app-service';
import { FORMULA_VERSION } from '../../../src/domain/constants/formula';
import type { ValuationSnapshot } from '../../../src/domain/models/valuation';

function minimalSnapshot(): ValuationSnapshot {
  return {
    formulaVersion: FORMULA_VERSION,
    lot: {
      tmh: '1',
      h2oPercent: '0',
      goldGrade: '1',
      goldGradeUnit: 'oz_tc',
      silverGrade: '0',
      silverGradeUnit: 'oz_tc',
      recPercentGold: '80',
      recPercentSilver: '0',
    },
    scenarios: [
      {
        label: 'A',
        name: 'A',
        maquila: '100',
        rcGold: '1',
        rcSilver: '0',
        consumos: '0',
        flete: '0',
        interGold: '1',
        interSilver: '0',
        factor: '1',
      },
    ],
    maquilaRangesUsed: [],
    appSettingsUsed: { factor: '1' },
    results: {
      formulaVersion: FORMULA_VERSION,
      tms: '1',
      leyGoldOzTc: '1',
      leySilverOzTc: '0',
      recPercentGold: '80',
      recPercentSilver: '0',
      recFactorGold: '0.8',
      recFactorSilver: '0',
      scenarios: [
        {
          label: 'A',
          name: 'A',
          valorAuPerTms: '1',
          valorAgPerTms: '0',
          valorFinalPerTms: '1',
          valorCompraTotal: '1',
          suggestedMaquila: '100',
          maquilaUsed: '100',
          recFactorGold: '0.8',
          recFactorSilver: '0',
        },
      ],
    },
    calculatedAt: '2026-05-24T12:00:00.000Z',
  };
}

describe('valuation app service permissions', () => {
  const db = createTestSqlExecutor();
  const repo = createSqliteValuationRepository(async () => db);
  const service = createValuationAppService(repo);

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => db.close());

  it('operador no puede editar cotización ajena', async () => {
    await service.insert(
      { id: 'u-admin', username: 'admin', role: 'admin' },
      {
        id: 'val-own',
        code: 'VAL-PERM-001',
        materialTypeCode: 'MSC',
        providerId: null,
        providerName: null,
        fecha: '2026-05-24',
        observaciones: null,
        formulaVersion: FORMULA_VERSION,
        snapshot: minimalSnapshot(),
        createdAt: '2026-05-24T12:00:00.000Z',
        updatedAt: '2026-05-24T12:00:00.000Z',
      }
    );

    await expect(
      service.update(
        { id: 'u-operador', username: 'operador', role: 'operador' },
        'val-own',
        {
          snapshot: minimalSnapshot(),
          updatedAt: '2026-05-24T13:00:00.000Z',
          code: 'VAL-PERM-001',
          materialTypeCode: 'MSC',
          providerId: null,
          providerName: null,
          fecha: '2026-05-25',
          observaciones: null,
        }
      )
    ).rejects.toThrow(/permiso/i);
  });
});
