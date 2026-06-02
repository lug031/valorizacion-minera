import { View } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { TextInput, HelperText } from 'react-native-paper';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { CotizadorSection } from '../ui/CotizadorSection';
import { TwoColumnGrid } from '../ui/TwoColumnGrid';
import { FormNumberField } from '../ui/FormNumberField';
import { MetalColumnHeader } from '../ui/MetalColumnHeader';
import { CommercialSuggestionText } from '../ui/CommercialSuggestionText';
import { InterSyncedHint } from './InterSyncedHint';
import { CatalogValueHint } from './CatalogValueHint';
import type { CatalogValueHint as CatalogValueHintType } from '../../utils/catalog-value-hint';
import { cotizadorStyles } from '../../theme/cotizador-styles';
import {
  formatMaquilaSuggestionLabel,
  formatRcGoldSuggestionLabel,
} from '../../utils/commercial-suggestion-ui';
import type { InterMetalHint } from '../../utils/inter-sync-hint';

interface Props {
  control: Control<ValuationFormValues>;
  goldGradeOzTc: string;
  suggestedMaquila: string | null;
  suggestedRcGold: string | null;
  onMaquilaEdit?: () => void;
  interGoldHint?: InterMetalHint | null;
  interSilverHint?: InterMetalHint | null;
  interGoldCurrentHint?: CatalogValueHintType | null;
  interSilverCurrentHint?: CatalogValueHintType | null;
  rcGoldCurrentHint?: CatalogValueHintType | null;
  rcSilverCurrentHint?: CatalogValueHintType | null;
  consumosCurrentHint?: CatalogValueHintType | null;
  fleteCurrentHint?: CatalogValueHintType | null;
}

function MetalCommercialColumn({
  control,
  metal,
  rcSuggestionText,
  interHint,
  interCurrentHint,
  rcCurrentHint,
  alignRcRow,
}: {
  control: Control<ValuationFormValues>;
  metal: 'gold' | 'silver';
  rcSuggestionText?: string | null;
  interHint?: InterMetalHint | null;
  interCurrentHint?: CatalogValueHintType | null;
  rcCurrentHint?: CatalogValueHintType | null;
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
      <CatalogValueHint hint={rcCurrentHint ?? null} />
      <FormNumberField control={control} name={inter} label="INTER" />
      <CatalogValueHint hint={interCurrentHint ?? null} />
      <InterSyncedHint hint={interCurrentHint ? null : (interHint ?? null)} />
    </View>
  );
}

export function CommercialParamsBlock({
  control,
  goldGradeOzTc,
  suggestedMaquila,
  suggestedRcGold,
  onMaquilaEdit,
  interGoldHint,
  interSilverHint,
  interGoldCurrentHint,
  interSilverCurrentHint,
  rcGoldCurrentHint,
  rcSilverCurrentHint,
  consumosCurrentHint,
  fleteCurrentHint,
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
            interHint={interGoldHint}
            interCurrentHint={interGoldCurrentHint}
            rcCurrentHint={rcGoldCurrentHint}
            alignRcRow={alignRcRow}
          />
        }
        right={
          <MetalCommercialColumn
            control={control}
            metal="silver"
            rcSuggestionText={rcHint}
            interHint={interSilverHint}
            interCurrentHint={interSilverCurrentHint}
            rcCurrentHint={rcSilverCurrentHint}
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
        <CatalogValueHint hint={consumosCurrentHint ?? null} />
        <FormNumberField control={control} name="scenario.flete" label="Flete" />
        <CatalogValueHint hint={fleteCurrentHint ?? null} />
        <FormNumberField control={control} name="scenario.otrosCostos" label="Otros costos" />
      </View>
    </CotizadorSection>
  );
}
