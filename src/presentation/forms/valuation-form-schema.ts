import { z } from 'zod';
import {
  fechaField,
  h2oPercentField,
  optionalNonNegativeNumeric,
  requiredNonNegativeNumeric,
} from './form-validators';

export const scenarioDraftSchema = z.object({
  label: z.enum(['A', 'B', 'C']),
  name: z.string().min(1),
  maquila: requiredNonNegativeNumeric,
  rcGold: requiredNonNegativeNumeric,
  rcSilver: requiredNonNegativeNumeric,
  consumos: requiredNonNegativeNumeric,
  flete: requiredNonNegativeNumeric,
  interGold: requiredNonNegativeNumeric,
  interSilver: requiredNonNegativeNumeric,
  otrosCostos: optionalNonNegativeNumeric,
});

export const valuationFormSchema = z.object({
  code: z.string().min(3),
  fecha: fechaField,
  materialTypeCode: z.string().min(1),
  providerName: z.string().optional(),
  observaciones: z.string().optional(),
  factor: requiredNonNegativeNumeric,
  tmh: requiredNonNegativeNumeric,
  h2oPercent: h2oPercentField,
  goldGradeOzTc: requiredNonNegativeNumeric,
  silverGradeOzTc: requiredNonNegativeNumeric,
  recPercentGold: requiredNonNegativeNumeric,
  recPercentSilver: requiredNonNegativeNumeric,
  activeScenarioIndex: z.number().min(0),
  scenario: scenarioDraftSchema,
});

export type ValuationFormValues = z.infer<typeof valuationFormSchema>;
