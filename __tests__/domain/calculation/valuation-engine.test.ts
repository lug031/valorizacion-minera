import { DEFAULT_MAQUILA_RANGES } from '../../../src/domain/constants/default-maquila-ranges';
import { FORMULA_VERSION } from '../../../src/domain/constants/formula';
import {
  calculateLotBase,
  calculateValuation,
} from '../../../src/domain/calculation/valuation-engine';
import type { LotInput, ScenarioCommercialParams } from '../../../src/domain/models/calculation';

const baseLot: LotInput = {
  tmh: '15',
  h2oPercent: '1',
  goldGrade: '1.0',
  goldGradeUnit: 'oz_tc',
  silverGrade: '5',
  silverGradeUnit: 'oz_tc',
  recPercentGold: '90',
  recPercentSilver: '85',
};

const scenarioA: ScenarioCommercialParams = {
  label: 'A',
  name: 'Nuestra propuesta',
  maquila: '135',
  rcGold: '50',
  rcSilver: '1',
  consumos: '10',
  flete: '5',
  interGold: '2000',
  interSilver: '25',
  factor: '1',
  otrosCostos: '0',
};

describe('calculateValuation', () => {
  it('calcula TMS y totales integrados', () => {
    const result = calculateValuation(
      baseLot,
      [scenarioA],
      DEFAULT_MAQUILA_RANGES
    );

    expect(result).not.toBeNull();
    expect(result!.formulaVersion).toBe(FORMULA_VERSION);
    expect(result!.tms).toBe('14.850');
    expect(result!.scenarios[0].valorAuPerTms).toBe('1605.00');
    // AG con REC plata 85: (25-1)*5*0.85 = 102
    expect(result!.scenarios[0].valorAgPerTms).toBe('102.00');
    expect(result!.scenarios[0].valorFinalPerTms).toBe('1707.00');
    expect(result!.scenarios[0].valorCompraTotal).toBe('25348.95');
  });

  it('soporta 3 escenarios con lote compartido', () => {
    const scenarios: ScenarioCommercialParams[] = [
      scenarioA,
      {
        ...scenarioA,
        label: 'B',
        name: 'Competidor',
        maquila: '190',
        consumos: '0',
      },
      {
        ...scenarioA,
        label: 'C',
        name: 'Alternativa',
        interGold: '1950',
      },
    ];

    const result = calculateValuation(baseLot, scenarios, DEFAULT_MAQUILA_RANGES);
    expect(result!.scenarios).toHaveLength(3);
    expect(result!.scenarios[0].valorCompraTotal).not.toBe(
      result!.scenarios[1].valorCompraTotal
    );
  });

  it('convierte ley en gr_tm antes de calcular', () => {
    const lot: LotInput = {
      ...baseLot,
      goldGrade: '34.28571',
      goldGradeUnit: 'gr_tm',
    };
    const base = calculateLotBase(lot);
    expect(base!.leyGoldOzTc.toFixed(5)).toBe('1.00000');
  });

  it('sugiere maquila según ley oro', () => {
    const result = calculateValuation(
      baseLot,
      [scenarioA],
      DEFAULT_MAQUILA_RANGES
    );
    expect(result!.scenarios[0].suggestedMaquila).toBe('135');
  });

  it('calcula con maquila sugerida si el escenario viene sin maquila', () => {
    const result = calculateValuation(
      baseLot,
      [{ ...scenarioA, maquila: '' }],
      DEFAULT_MAQUILA_RANGES
    );
    expect(result!.scenarios[0].maquilaUsed).toBe('135');
    expect(result!.scenarios[0].valorAuPerTms).toBe('1605.00');
  });
});
