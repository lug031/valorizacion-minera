import {
  buildScenarioComparison,
  findBestScenarioTotal,
} from '../../src/presentation/utils/scenario-comparison';
import type { ScenarioCalculationResult } from '../../src/domain/models/calculation';

const mockScenarios: ScenarioCalculationResult[] = [
  {
    label: 'A',
    name: 'Propuesta',
    valorAuPerTms: '100.00',
    valorAgPerTms: '50.00',
    valorFinalPerTms: '150.00',
    valorCompraTotal: '1500.00',
    suggestedMaquila: '90',
    maquilaUsed: '90',
    recFactorGold: '0.9',
    recFactorSilver: '0.85',
  },
  {
    label: 'B',
    name: 'Competidor',
    valorAuPerTms: '110.00',
    valorAgPerTms: '50.00',
    valorFinalPerTms: '160.00',
    valorCompraTotal: '1600.00',
    suggestedMaquila: '100',
    maquilaUsed: '100',
    recFactorGold: '0.9',
    recFactorSilver: '0.85',
  },
  {
    label: 'C',
    name: 'Alt',
    valorAuPerTms: '90.00',
    valorAgPerTms: '50.00',
    valorFinalPerTms: '140.00',
    valorCompraTotal: '1400.00',
    suggestedMaquila: '80',
    maquilaUsed: '80',
    recFactorGold: '0.9',
    recFactorSilver: '0.85',
  },
];

describe('scenario comparison', () => {
  it('calcula diferencia vs escenario A', () => {
    const rows = buildScenarioComparison(mockScenarios);
    expect(rows).toHaveLength(3);
    expect(rows[0].diffTotalVsA).toBeNull();
    expect(rows[1].diffTotalVsA).toBe('100.00');
    expect(rows[2].diffTotalVsA).toBe('-100.00');
  });

  it('identifica escenario con mayor total', () => {
    expect(findBestScenarioTotal(mockScenarios)).toBe('Escenario B');
  });
});
