import { buildPdfViewModelFromSnapshot } from '../../../src/services/pdf/builders/valuation-pdf-builder';

import { renderValuationPdfHtml } from '../../../src/services/pdf/templates/valuation-template';

import { FORMULA_VERSION } from '../../../src/domain/constants/formula';

import type { ValuationSnapshot } from '../../../src/domain/models/valuation';



function mockSnapshot(): ValuationSnapshot {

  return {

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

      {

        label: 'B',

        name: 'Competidor',

        maquila: '190',

        rcGold: '50',

        rcSilver: '1',

        consumos: '0',

        flete: '5',

        interGold: '2000',

        interSilver: '25',

        factor: '1',

      },

    ],

    maquilaRangesUsed: [],

    appSettingsUsed: { factor: '1' },

    results: {

      formulaVersion: FORMULA_VERSION,

      tms: '14.850',

      leyGoldOzTc: '1',

      leySilverOzTc: '5',

      recPercentGold: '90',

      recPercentSilver: '85',

      recFactorGold: '0.9',

      recFactorSilver: '0.85',

      scenarios: [

        {

          label: 'A',

          name: 'Propuesta',

          valorAuPerTms: '1605.00',

          valorAgPerTms: '102.00',

          valorFinalPerTms: '1707.00',

          valorCompraTotal: '25348.95',

          suggestedMaquila: '135',

          maquilaUsed: '135',

          recFactorGold: '0.9',

          recFactorSilver: '0.85',

        },

        {

          label: 'B',

          name: 'Competidor',

          valorAuPerTms: '1500.00',

          valorAgPerTms: '102.00',

          valorFinalPerTms: '1602.00',

          valorCompraTotal: '23789.70',

          suggestedMaquila: '190',

          maquilaUsed: '190',

          recFactorGold: '0.9',

          recFactorSilver: '0.85',

        },

      ],

    },

    calculatedAt: '2026-05-24T10:00:00.000Z',

    activeScenarioIndex: 0,

  };

}



describe('valuation pdf builder', () => {

  it('exporta solo el escenario principal activo', () => {

    const vm = buildPdfViewModelFromSnapshot(mockSnapshot(), {

      code: 'VAL-TEST-001',

      fecha: '2026-05-24',

      materialTypeCode: 'MSC',

      operatorName: 'Operador Test',

    });



    expect(vm.lotTitle).toBe('LOTE N° VAL-TEST-001');

    expect(vm.metalRows).toHaveLength(2);

    expect(vm.metalRows[0].metal).toBe('Au');

    expect(vm.metalRows[0].precioTms).toContain('1,605');

    expect(vm.summary.totalAuAg).toContain('25,348');

  });



  it('genera HTML formato preliquidación por lote', () => {

    const html = renderValuationPdfHtml(

      buildPdfViewModelFromSnapshot(mockSnapshot(), {

        code: 'VAL-HTML',

        fecha: '2026-05-24',

        materialTypeCode: 'MOC',

        operatorName: 'Admin',

        observaciones: 'Lote de prueba',

      })

    );



    expect(html).toContain('LOTE N° VAL-HTML');

    expect(html).toContain('Ley Oz/Tc');

    expect(html).toContain('Precio TMS');

    expect(html).toContain('Total Au + Ag');
    expect(html).toContain('Consumos US$/TMS');
    expect(html).toContain('Costos Asignados US$/TMH');
    expect(html).not.toContain('Consumos US$</td>');

    expect(html).toContain('preliquidación');

    expect(html).not.toContain('Comparativo de escenarios');

    expect(html).not.toContain('Escenario B');

    expect(html).not.toContain('calculateValuation');
    expect(html).not.toContain('Fórmulas:');
    expect(html).not.toContain('preliquidacion-lote-v2');

  });

});


