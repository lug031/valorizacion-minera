import { gramsToOzTc, ozTcToGrams } from '../../domain/calculation/grade-conversion';
import { tryToDecimal } from '../../utils/decimal';

const GRADE_DISPLAY_DECIMALS = 4;

/** oz/tc → gr/tm para mostrar en UI (no altera el motor). */
export function ozTcToGrTmDisplay(ozTc: string | undefined): string {
  const d = tryToDecimal(ozTc ?? '');
  if (!d) return '';
  return ozTcToGrams(d).toFixed(GRADE_DISPLAY_DECIMALS);
}

/** gr/tm → oz/tc al editar la columna gr/tm. */
export function grTmToOzTcInput(grTm: string): string {
  const d = tryToDecimal(grTm);
  if (!d) return '';
  return gramsToOzTc(d).toFixed(GRADE_DISPLAY_DECIMALS);
}
