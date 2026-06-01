import { validateDeviceBindingOnStartup } from '../device-binding.service';
import { useDeviceBindingStore } from '../../presentation/store/device-binding-store';

/** Revalida binding y actualiza store (bootstrap, retry manual, post-sync). */
export async function refreshDeviceBindingGate(): Promise<void> {
  const result = await validateDeviceBindingOnStartup();
  useDeviceBindingStore.getState().setCheckResult(result);
}
