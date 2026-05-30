import type { ConfigFormValues } from '../forms/config-form-schema';
import type { SettingsDefaults } from '../store/settings-store';

/** Mapea el estado de settings-store a valores del formulario de configuración. */
export function settingsToConfigFormValues(settings: SettingsDefaults): ConfigFormValues {
  return {
    factor: settings.factor,
    recPercentGold: settings.recPercentGold,
    recPercentSilver: settings.recPercentSilver,
    rcGold: settings.rcGold,
    rcSilver: settings.rcSilver,
    consumos: settings.consumos,
    flete: settings.flete,
    interGold: settings.interGold,
    interSilver: settings.interSilver,
  };
}
