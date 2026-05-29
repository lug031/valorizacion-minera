import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteValuationRepository } from '../../src/data/repositories/sqlite-valuation-repository';
import { parseSnapshot } from '../../src/data/repositories/valuation-repository';
import { FORMULA_VERSION } from '../../src/domain/constants/formula';
import type { ValuationSnapshot } from '../../src/domain/models/valuation';

function buildSnapshot(): ValuationSnapshot {
  return {
    formulaVersion: FORMULA_VERSION,
    lot: {
      tmh: '10',
      h2oPercent: '2',
      goldGrade: '0.5',
      goldGradeUnit: 'oz_tc',
      silverGrade: '3',
      silverGradeUnit: 'oz_tc',
      recPercentGold: '90',
      recPercentSilver: '85',
    },
    scenarios: [
      {
        label: 'A',
        name: 'A',
        maquila: '110',
        rcGold: '1',
        rcSilver: '1',
        consumos: '0',
        flete: '0',
        interGold: '2000',
        interSilver: '25',
        factor: '1',
      },
    ],
    maquilaRangesUsed: [{ minLeyOzTc: '0.4', maxLeyOzTc: '0.5', maquila: '110' }],
    appSettingsUsed: { factor: '1' },
    results: {
      formulaVersion: FORMULA_VERSION,
      tms: '9.800',
      leyGoldOzTc: '0.5',
      leySilverOzTc: '3',
      recPercentGold: '90',
      recPercentSilver: '85',
      recFactorGold: '0.9',
      recFactorSilver: '0.85',
      scenarios: [
        {
          label: 'A',
          name: 'A',
          valorAuPerTms: '100.00',
          valorAgPerTms: '50.00',
          valorFinalPerTms: '150.00',
          valorCompraTotal: '1470.00',
          suggestedMaquila: '110',
          maquilaUsed: '110',
          recFactorGold: '0.9',
          recFactorSilver: '0.85',
        },
      ],
    },
    calculatedAt: '2026-05-24T12:00:00.000Z',
  };
}

describe('sqlite valuation repository', () => {
  const db = createTestSqlExecutor();
  const repo = createSqliteValuationRepository(async () => db);

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => db.close());

  it('inserta y busca por código', async () => {
    const snap = buildSnapshot();
    const id = 'val-test-1';
    await repo.insert({
      id,
      code: 'VAL-UNIT-001',
      materialTypeCode: 'MSC',
      providerId: null,
      providerName: null,
      fecha: '2026-05-24',
      observaciones: null,
      formulaVersion: FORMULA_VERSION,
      snapshot: snap,
      createdByUserId: 'u-admin',
      createdByUsername: 'admin',
      updatedByUserId: 'u-admin',
      updatedByUsername: 'admin',
      createdAt: '2026-05-24T12:00:00.000Z',
      updatedAt: '2026-05-24T12:00:00.000Z',
    });

    const found = await repo.findByCode('VAL-UNIT-001');
    expect(found?.id).toBe(id);
    const parsed = parseSnapshot(found!.snapshotJson);
    expect(parsed.results.tms).toBe('9.800');
  });

  it('snapshot permanece inmutable tras cambiar settings globales', async () => {
    const found = await repo.findByCode('VAL-UNIT-001');
    const before = parseSnapshot(found!.snapshotJson);
    const originalTms = before.results.tms;

    await db.run(
      `UPDATE app_settings SET default_rec_percent_gold = '50' WHERE id = 'default'`
    );

    const again = await repo.findByCode('VAL-UNIT-001');
    const after = parseSnapshot(again!.snapshotJson);
    expect(after.results.tms).toBe(originalTms);
  });

  it('duplica valorización con nuevo código', async () => {
    const newId = await repo.duplicate('val-test-1', 'VAL-UNIT-002', {
      id: 'u-admin',
      username: 'admin',
      role: 'admin',
    });
    const dup = await repo.findById(newId);
    expect(dup?.code).toBe('VAL-UNIT-002');
    expect(parseSnapshot(dup!.snapshotJson).results.tms).toBe('9.800');
  });

  it('actualiza valorización existente sin duplicar código', async () => {
    const snap = buildSnapshot();
    snap.results.tms = '10.500';
    await repo.update('val-test-1', {
      snapshot: snap,
      updatedAt: '2026-05-24T13:00:00.000Z',
      code: 'VAL-UNIT-001',
      materialTypeCode: 'MOC',
      providerId: null,
      providerName: 'Proveedor editado',
      fecha: '2026-05-25',
      observaciones: 'Editado',
      updatedByUserId: 'u-admin',
      updatedByUsername: 'admin',
    });
    const found = await repo.findById('val-test-1');
    expect(found?.code).toBe('VAL-UNIT-001');
    expect(found?.materialTypeCode).toBe('MOC');
    expect(parseSnapshot(found!.snapshotJson).results.tms).toBe('10.500');
  });

  it('elimina valorización', async () => {
    const listBefore = await repo.search({ code: 'VAL-UNIT-002' });
    expect(listBefore.length).toBe(1);
    await repo.delete(listBefore[0].id, 'u-admin');
    const listAfter = await repo.search({ code: 'VAL-UNIT-002' });
    expect(listAfter.length).toBe(0);
  });
});
