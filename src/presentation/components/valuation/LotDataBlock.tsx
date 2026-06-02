import { useMemo } from 'react';
import { View } from 'react-native';
import { useWatch, type Control } from 'react-hook-form';
import { calculateTms } from '../../../domain/calculation/tms';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { CotizadorSection } from '../ui/CotizadorSection';
import { FormNumberField } from '../ui/FormNumberField';
import { ReadonlyMetricField } from '../ui/ReadonlyMetricField';
import { cotizadorStyles } from '../../theme/cotizador-styles';
import { CatalogValueHint } from './CatalogValueHint';
import type { CatalogValueHint as CatalogValueHintType } from '../../utils/catalog-value-hint';

interface Props {
  control: Control<ValuationFormValues>;
  factorCurrentHint?: CatalogValueHintType | null;
}

export function LotDataBlock({ control, factorCurrentHint }: Props) {
  const tmh = useWatch({ control, name: 'tmh' });
  const h2o = useWatch({ control, name: 'h2oPercent' });

  const tmsDisplay = useMemo(() => {
    const tms = calculateTms(tmh ?? '', h2o ?? '');
    return tms ? tms.toFixed(3) : '';
  }, [tmh, h2o]);

  return (
    <CotizadorSection title="DATOS DEL LOTE">
      <View style={cotizadorStyles.inlineRow}>
        <View style={{ flex: 1 }}>
          <FormNumberField control={control} name="tmh" label="TMH" />
        </View>
        <View style={{ flex: 1 }}>
          <FormNumberField control={control} name="h2oPercent" label="H2O %" />
        </View>
      </View>
      <ReadonlyMetricField label="TMS (calculado)" value={tmsDisplay} highlight />
      <FormNumberField control={control} name="factor" label="Factor" />
      <CatalogValueHint hint={factorCurrentHint ?? null} />
    </CotizadorSection>
  );
}
