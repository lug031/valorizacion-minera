import type { Control } from 'react-hook-form';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { CotizadorSection } from '../ui/CotizadorSection';
import { TwoColumnGrid } from '../ui/TwoColumnGrid';
import { MetalGradeColumn } from './MetalGradeColumn';
import type { CatalogValueHint } from '../../utils/catalog-value-hint';

interface Props {
  control: Control<ValuationFormValues>;
  recGoldCurrentHint?: CatalogValueHint | null;
  recSilverCurrentHint?: CatalogValueHint | null;
}

export function GradesRecoveryBlock({
  control,
  recGoldCurrentHint,
  recSilverCurrentHint,
}: Props) {
  return (
    <CotizadorSection title="LEYES Y RECUPERACIÓN">
      <TwoColumnGrid
        left={
          <MetalGradeColumn
            control={control}
            metal="gold"
            recCurrentHint={recGoldCurrentHint}
          />
        }
        right={
          <MetalGradeColumn
            control={control}
            metal="silver"
            recCurrentHint={recSilverCurrentHint}
          />
        }
        stackOnNarrow={false}
      />
    </CotizadorSection>
  );
}
