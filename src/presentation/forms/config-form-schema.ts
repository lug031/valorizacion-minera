import { z } from 'zod';
import { requiredNonNegativeNumeric } from './form-validators';

export const configFormSchema = z.object({
  factor: requiredNonNegativeNumeric,
  recPercentGold: requiredNonNegativeNumeric,
  recPercentSilver: requiredNonNegativeNumeric,
  rcGold: requiredNonNegativeNumeric,
  rcSilver: requiredNonNegativeNumeric,
  consumos: requiredNonNegativeNumeric,
  flete: requiredNonNegativeNumeric,
  interGold: requiredNonNegativeNumeric,
  interSilver: requiredNonNegativeNumeric,
});

export type ConfigFormValues = z.infer<typeof configFormSchema>;
