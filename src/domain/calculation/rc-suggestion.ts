import { DEFAULT_RC_GOLD_SUGGESTION } from '../constants/commercial-suggestions';
import type { NumericInput } from '../../utils/numeric-input';

/**
 * Sugiere RC oro. Hoy: valor fijo de negocio (60).
 * Parámetro ley reservado para rangos futuros sin cambiar la firma.
 */
export function suggestRcGold(_leyGoldOzTc?: NumericInput): string {
  return DEFAULT_RC_GOLD_SUGGESTION;
}
