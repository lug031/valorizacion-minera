import { COTIZADOR_DEFAULTS } from '../../src/domain/constants/cotizador-defaults';
import { settingsToConfigFormValues } from '../../src/presentation/utils/settings-form-values';

describe('settingsToConfigFormValues', () => {
  it('mapea valores del store al formulario de configuración', () => {
    const values = settingsToConfigFormValues({
      factor: COTIZADOR_DEFAULTS.factor,
      recPercentGold: COTIZADOR_DEFAULTS.recPercentGold,
      recPercentSilver: COTIZADOR_DEFAULTS.recPercentSilver,
      rcGold: COTIZADOR_DEFAULTS.rcGold,
      rcSilver: COTIZADOR_DEFAULTS.rcSilver,
      consumos: COTIZADOR_DEFAULTS.consumos,
      flete: COTIZADOR_DEFAULTS.flete,
      interGold: COTIZADOR_DEFAULTS.interGold,
      interSilver: COTIZADOR_DEFAULTS.interSilver,
    });

    expect(values.interGold).toBe('3322.10');
    expect(values.interSilver).toBe('0');
  });
});
