jest.mock('../../src/config/features', () => ({
  FEATURES: { scenarioComparison: true },
}));

import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteDraftRepository } from '../../src/data/repositories/sqlite-draft-repository';
import { createEmptyDraft } from '../../src/presentation/store/valuation-draft-store';
import type { SettingsDefaults } from '../../src/presentation/store/settings-store';

const defaults: SettingsDefaults = {
  factor: '1',
  recPercentGold: '90',
  recPercentSilver: '85',
  rcGold: '50',
  rcSilver: '1',
  consumos: '10',
  flete: '5',
  interGold: '2000',
  interSilver: '25',
};

describe('draft repository 3 escenarios', () => {
  const db = createTestSqlExecutor();
  const repo = createSqliteDraftRepository(async () => db);

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => db.close());

  it('guarda y restaura draft con A/B/C y factor compartido', async () => {
    const draft = createEmptyDraft(defaults, { comparisonEnabled: true });
    draft.scenarios[1].maquila = '190';
    draft.scenarios[2].maquila = '110';
    draft.activeScenarioIndex = 2;

    await repo.save('u-operador', draft);
    const loaded = await repo.load('u-operador');

    expect(loaded).not.toBeNull();
    expect(loaded!.factor).toBe('1');
    expect(loaded!.scenarios).toHaveLength(3);
    expect(loaded!.scenarios[1].maquila).toBe('190');
    expect(loaded!.activeScenarioIndex).toBe(2);
    expect((loaded!.scenarios[0] as { factor?: string }).factor).toBeUndefined();
  });
});
