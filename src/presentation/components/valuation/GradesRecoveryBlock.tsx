import type { Control } from 'react-hook-form';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { CotizadorSection } from '../ui/CotizadorSection';
import { TwoColumnGrid } from '../ui/TwoColumnGrid';
import { MetalGradeColumn } from './MetalGradeColumn';

interface Props {
  control: Control<ValuationFormValues>;
}

export function GradesRecoveryBlock({ control }: Props) {
  return (
    <CotizadorSection title="LEYES Y RECUPERACIÓN">
      <TwoColumnGrid
        left={<MetalGradeColumn control={control} metal="gold" />}
        right={<MetalGradeColumn control={control} metal="silver" />}
        stackOnNarrow={false}
      />
    </CotizadorSection>
  );
}
