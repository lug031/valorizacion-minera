import { DEFAULT_MAQUILA_RANGES } from '../../../src/domain/constants/default-maquila-ranges';
import { calculateValuationSet } from '../../../src/domain/calculation/valuation-set';
import type { LotInput, ScenarioCommercialParams } from '../../../src/domain/models/calculation';

const lot: LotInput = {
  tmh: '15',
  h2oPercent: '1',
  goldGrade: '1.0',
  goldGradeUnit: 'oz_tc',
  silverGrade: '5',
  silverGradeUnit: 'oz_tc',
  recPercentGold: '90',
  recPercentSilver: '85',
};

const baseScenario = (label: 'A' | 'B' | 'C', maquila: string): ScenarioCommercialParams => ({
  label,
  name: label,
  maquila,
  rcGold: '50',
  rcSilver: '1',
  consumos: '10',
  flete: '5',
  interGold: '2000',
  interSilver: '25',
  factor: '1',
  otrosCostos: '0',
});

describe('calculateValuationSet', () => {
  it('calcula 3 escenarios independientes con mismo lote y factor', () => {
    const result = calculateValuationSet(
      lot,
      [baseScenario('A', '135'), baseScenario('B', '190'), baseScenario('C', '110')],
      DEFAULT_MAQUILA_RANGES
    );

    expect(result!.scenarios).toHaveLength(3);
    const totals = result!.scenarios.map((s) => parseFloat(s.valorCompraTotal));
    expect(totals[0]).not.toBe(totals[1]);
    expect(totals[1]).not.toBe(totals[2]);
    expect(result!.tms).toBe('14.850');
  });
});
