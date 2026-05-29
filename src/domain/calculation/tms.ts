import { Decimal, tryToDecimal } from '../../utils/decimal';
import { roundDown } from '../../utils/rounding';

const TMS_DECIMAL_PLACES = 3;

/**
 * TMS = REDONDEAR.MENOS( TMH - ((TMH * H2O) / 100), 3 )
 */
export function calculateTms(tmh: string | number, h2oPercent: string | number): Decimal | null {
  const tmhDec = tryToDecimal(tmh);
  const h2oDec = tryToDecimal(h2oPercent);
  if (!tmhDec || !h2oDec) return null;

  if (!tmhDec.isFinite() || !h2oDec.isFinite()) return null;
  if (tmhDec.isNegative() || h2oDec.isNegative()) return null;

  const moisture = tmhDec.mul(h2oDec).div(100);
  const dry = tmhDec.sub(moisture);
  return roundDown(dry, TMS_DECIMAL_PLACES);
}
