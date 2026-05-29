import { View } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { TextInput, HelperText } from 'react-native-paper';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { CotizadorSection } from '../ui/CotizadorSection';
import { TwoColumnGrid } from '../ui/TwoColumnGrid';
import { FormNumberField } from '../ui/FormNumberField';
import { MetalColumnHeader } from '../ui/MetalColumnHeader';
import { CommercialSuggestionText } from '../ui/CommercialSuggestionText';
import { cotizadorStyles } from '../../theme/cotizador-styles';
import {
  formatMaquilaSuggestionLabel,
  formatRcGoldSuggestionLabel,
} from '../../utils/commercial-suggestion-ui';

interface Props {
  control: Control<ValuationFormValues>;
  goldGradeOzTc: string;
  suggestedMaquila: string | null;
  suggestedRcGold: string | null;
  onMaquilaEdit?: () => void;
}

function MetalCommercialColumn({
  control,
  metal,
  rcSuggestionText,
  alignRcRow,
}: {
  control: Control<ValuationFormValues>;
  metal: 'gold' | 'silver';
  rcSuggestionText?: string | null;
  alignRcRow?: boolean;
}) {
  const rc = metal === 'gold' ? 'scenario.rcGold' : 'scenario.rcSilver';
  const inter = metal === 'gold' ? 'scenario.interGold' : 'scenario.interSilver';

  return (
    <View>
      <MetalColumnHeader metal={metal} />
      <FormNumberField control={control} name={rc} label="RC" />
      <CommercialSuggestionText
        text={metal === 'gold' ? (rcSuggestionText ?? null) : null}
        reserveSpace={alignRcRow}
      />
      <FormNumberField control={control} name={inter} label="INTER" />
    </View>
  );
}

export function CommercialParamsBlock({
  control,
  goldGradeOzTc,
  suggestedMaquila,
  suggestedRcGold,
  onMaquilaEdit,
}: Props) {
  const rcHint =
    suggestedRcGold != null ? formatRcGoldSuggestionLabel(suggestedRcGold) : null;
  const maquilaHint =
    suggestedMaquila != null
      ? formatMaquilaSuggestionLabel(goldGradeOzTc, suggestedMaquila)
      : null;
  const alignRcRow = Boolean(rcHint);

  return (
    <CotizadorSection title="PARÁMETROS COMERCIALES">
      <TwoColumnGrid
        left={
          <MetalCommercialColumn
            control={control}
            metal="gold"
            rcSuggestionText={rcHint}
            alignRcRow={alignRcRow}
          />
        }
        right={
          <MetalCommercialColumn
            control={control}
            metal="silver"
            rcSuggestionText={rcHint}
            alignRcRow={alignRcRow}
          />
        }
        stackOnNarrow={false}
      />
      <View style={{ marginTop: 8 }}>
        <Controller
          control={control}
          name="scenario.maquila"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <>
              <TextInput
                mode="outlined"
                label="Maquila"
                value={value?.toString() ?? ''}
                onBlur={onBlur}
                onChangeText={(t) => {
                  onMaquilaEdit?.();
                  onChange(t);
                }}
                keyboardType="decimal-pad"
                style={cotizadorStyles.globalField}
              />
              {error ? <HelperText type="error">{error.message}</HelperText> : null}
              <CommercialSuggestionText text={maquilaHint} />
            </>
          )}
        />
        <FormNumberField control={control} name="scenario.consumos" label="Consumos" />
        <FormNumberField control={control} name="scenario.flete" label="Flete" />
        <FormNumberField control={control} name="scenario.otrosCostos" label="Otros costos" />
      </View>
    </CotizadorSection>
  );
}
