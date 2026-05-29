import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteValuationRepository } from '../../src/data/repositories/sqlite-valuation-repository';
import { parseSnapshot } from '../../src/data/repositories/valuation-repository';
import { snapshotToDraft } from '../../src/data/mappers/snapshot-to-draft';
import { FORMULA_VERSION } from '../../src/domain/constants/formula';
import type { ValuationSnapshot } from '../../src/domain/models/valuation';

function buildMultiSnapshot(): ValuationSnapshot {
  const scenario = (label: 'A' | 'B' | 'C', maquila: string, total: string) => ({
    label,
    name: label,
    valorAuPerTms: '100.00',
    valorAgPerTms: '50.00',
    valorFinalPerTms: '150.00',
    valorCompraTotal: total,
    suggestedMaquila: maquila,
    maquilaUsed: maquila,
    recFactorGold: '0.9',
    recFactorSilver: '0.85',
  });

  return {
    formulaVersion: FORMULA_VERSION,
    lot: {
      tmh: '10',
      h2oPercent: '0',
      goldGrade: '1',
      goldGradeUnit: 'oz_tc',
      silverGrade: '1',
      silverGradeUnit: 'oz_tc',
      recPercentGold: '90',
      recPercentSilver: '85',
    },
    scenarios: [
      { label: 'A', name: 'A', maquila: '90', rcGold: '0', rcSilver: '0', consumos: '0', flete: '0', interGold: '2000', interSilver: '25', factor: '1' },
      { label: 'B', name: 'B', maquila: '190', rcGold: '0', rcSilver: '0', consumos: '0', flete: '0', interGold: '2000', interSilver: '25', factor: '1' },
      { label: 'C', name: 'C', maquila: '110', rcGold: '0', rcSilver: '0', consumos: '0', flete: '0', interGold: '2000', interSilver: '25', factor: '1' },
    ],
    maquilaRangesUsed: [],
    appSettingsUsed: { factor: '1' },
    results: {
      formulaVersion: FORMULA_VERSION,
      tms: '10.000',
      leyGoldOzTc: '1',
      leySilverOzTc: '1',
      recPercentGold: '90',
      recPercentSilver: '85',
      recFactorGold: '0.9',
      recFactorSilver: '0.85',
      scenarios: [scenario('A', '90', '1000'), scenario('B', '190', '2000'), scenario('C', '110', '1500')],
    },
    calculatedAt: '2026-05-24T00:00:00.000Z',
    activeScenarioIndex: 1,
  };
}

describe('snapshot 3 escenarios', () => {
  const db = createTestSqlExecutor();
  const repo = createSqliteValuationRepository(async () => db);

  beforeAll(async () => runMigrations(db));
  afterAll(() => db.close());

  it('persiste y restaura 3 escenarios en snapshot inmutable', async () => {
    const snap = buildMultiSnapshot();
    await repo.insert({
      id: 'val-multi',
      code: 'VAL-MULTI',
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

    const row = await repo.findById('val-multi');
    expect(row?.createdByUsername).toBe('admin');
    expect(row?.updatedByUsername).toBe('admin');
    const parsed = parseSnapshot(row!.snapshotJson);
    expect(parsed.scenarios).toHaveLength(3);
    expect(parsed.results.scenarios[2].valorCompraTotal).toMatch(/^1500(\.00)?$/);
    expect(parsed.activeScenarioIndex).toBe(1);

    const draft = snapshotToDraft(parsed, {
      code: 'VAL-MULTI',
      fecha: '2026-05-24',
      materialTypeCode: 'MSC',
      providerName: '',
      observaciones: '',
    });
    expect(draft.scenarios[1].maquila).toBe('190');
    expect(draft.factor).toBe('1');
    expect(draft.activeScenarioIndex).toBe(1);
  });
});
