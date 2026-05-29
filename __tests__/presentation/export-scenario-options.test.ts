import {
  buildExportOptionsFromDraft,
  buildExportScenarioOptions,
} from '../../src/presentation/utils/export-scenario-options';
import type { ValuationCalculationResult } from '../../src/domain/models/calculation';
import type { ValuationDraft } from '../../src/domain/models/draft';

const results: ValuationCalculationResult = {
  formulaVersion: 'v1',
  tms: '13.000',
  leyGoldOzTc: '1.012',
  leySilverOzTc: '0',
  recPercentGold: '84',
  recPercentSilver: '0',
  recFactorGold: '0.84',
  recFactorSilver: '0',
  scenarios: [
    {
      label: 'A',
      name: 'Propuesta',
      valorAuPerTms: '100',
      valorAgPerTms: '0',
      valorFinalPerTms: '100',
      valorCompraTotal: '1300.00',
      suggestedMaquila: '140',
      maquilaUsed: '140',
      recFactorGold: '0.84',
      recFactorSilver: '0',
    },
    {
      label: 'B',
      name: 'Competidor',
      valorAuPerTms: '90',
      valorAgPerTms: '0',
      valorFinalPerTms: '90',
      valorCompraTotal: '1170.00',
      suggestedMaquila: '140',
      maquilaUsed: '150',
      recFactorGold: '0.84',
      recFactorSilver: '0',
    },
  ],
};

describe('export-scenario-options', () => {
  it('arma opciones con label, nombre y total por escenario', () => {
    const opts = buildExportScenarioOptions(
      [
        { label: 'A', name: 'Propuesta' },
        { label: 'B', name: 'Competidor' },
      ],
      results
    );
    expect(opts).toHaveLength(2);
    expect(opts[0]).toEqual({ label: 'A', name: 'Propuesta', total: '1300.00' });
    expect(opts[1].total).toBe('1170.00');
  });

  it('buildExportOptionsFromDraft usa escenarios del draft', () => {
    const draft = {
      scenarios: [
        { label: 'A', name: 'Propuesta' },
        { label: 'B', name: 'Competidor' },
      ],
      activeScenarioIndex: 0,
    } as ValuationDraft;
    const opts = buildExportOptionsFromDraft(draft, results);
    expect(opts).toHaveLength(1);
    expect(opts[0].name).toBe('Propuesta');
  });

  it('V1: filtra a escenario activo cuando comparación desactivada', () => {
    const draft = {
      scenarios: [
        { label: 'A', name: 'Propuesta' },
        { label: 'B', name: 'Competidor' },
      ],
      activeScenarioIndex: 1,
    } as ValuationDraft;
    const opts = buildExportOptionsFromDraft(draft, results);
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe('B');
    expect(opts[0].total).toBe('1170.00');
  });
});
