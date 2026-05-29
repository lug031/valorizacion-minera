import { snapshotToDraft } from '../../src/data/mappers/snapshot-to-draft';
import type { ValuationSnapshot } from '../../src/domain/models/valuation';
import { FORMULA_VERSION } from '../../src/domain/constants/formula';

describe('snapshotToDraft', () => {
  const snapshot: ValuationSnapshot = {
    formulaVersion: FORMULA_VERSION,
    lot: {
      tmh: '15',
      h2oPercent: '1',
      goldGrade: '1.0',
      goldGradeUnit: 'oz_tc',
      silverGrade: '5',
      silverGradeUnit: 'oz_tc',
      recPercentGold: '90',
      recPercentSilver: '85',
    },
    scenarios: [
      {
        label: 'A',
        name: 'Propuesta',
        maquila: '135',
        rcGold: '50',
        rcSilver: '1',
        consumos: '10',
        flete: '5',
        interGold: '2000',
        interSilver: '25',
        factor: '1',
        otrosCostos: '0',
      },
    ],
    maquilaRangesUsed: [],
    appSettingsUsed: { factor: '1.25' },
    results: {
      formulaVersion: FORMULA_VERSION,
      tms: '14.850',
      leyGoldOzTc: '1',
      leySilverOzTc: '5',
      recPercentGold: '90',
      recPercentSilver: '85',
      recFactorGold: '0.9',
      recFactorSilver: '0.85',
      scenarios: [],
    },
    calculatedAt: '2026-05-24T00:00:00.000Z',
  };

  it('restaura lote y escenarios sin alterar snapshot', () => {
    const draft = snapshotToDraft(snapshot, {
      code: 'VAL-TEST',
      fecha: '2026-05-24',
      materialTypeCode: 'MSC',
      providerName: 'Demo',
      observaciones: '',
    });
    expect(draft.tmh).toBe('15');
    expect(draft.goldGradeOzTc).toBe('1.000000');
    expect(draft.scenarios[0].maquila).toBe('135');
    expect(draft.scenarios).toHaveLength(1);
    expect(draft.comparisonEnabled).toBe(false);
    expect(draft.factor).toBe('1.25');
  });
});
