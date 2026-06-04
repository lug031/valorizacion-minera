import { useConfigStore } from '../../presentation/store/config-store';
import { useSettingsStore, type SettingsDefaults } from '../../presentation/store/settings-store';
import { runMasterConfigSyncThrottled } from './schedule-master-config-sync';

/**
 * Descarga config maestra (si hay red) y devuelve defaults listos para una cotización nueva.
 * Usar al pulsar «Nueva valorización» para aplicar INTER y demás valores vigentes.
 */
export async function loadCommercialDefaultsForValuation(options?: {
  force?: boolean;
}): Promise<SettingsDefaults> {
  await runMasterConfigSyncThrottled({ force: options?.force ?? true });
  await Promise.all([
    useConfigStore.getState().hydrate(),
    useSettingsStore.getState().hydrateFromDb(),
  ]);
  const s = useSettingsStore.getState();
  return {
    factor: s.factor,
    recPercentGold: s.recPercentGold,
    recPercentSilver: s.recPercentSilver,
    rcGold: s.rcGold,
    rcSilver: s.rcSilver,
    consumos: s.consumos,
    flete: s.flete,
    interGold: s.interGold,
    interSilver: s.interSilver,
  };
}
