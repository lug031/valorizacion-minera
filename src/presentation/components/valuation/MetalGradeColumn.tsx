import { useCallback } from 'react';
import { View } from 'react-native';
import type { Control, FieldPath } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TextInput, HelperText } from 'react-native-paper';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { FormNumberField } from '../ui/FormNumberField';
import { MetalColumnHeader } from '../ui/MetalColumnHeader';
import { CatalogValueHint } from './CatalogValueHint';
import type { CatalogValueHint as CatalogValueHintType } from '../../utils/catalog-value-hint';
import { grTmToOzTcInput, ozTcToGrTmDisplay } from '../../utils/grade-display';

interface Props {
  control: Control<ValuationFormValues>;
  metal: 'gold' | 'silver';
  recCurrentHint?: CatalogValueHintType | null;
}

export function MetalGradeColumn({ control, metal, recCurrentHint }: Props) {
  const ozField: FieldPath<ValuationFormValues> =
    metal === 'gold' ? 'goldGradeOzTc' : 'silverGradeOzTc';
  const recField: FieldPath<ValuationFormValues> =
    metal === 'gold' ? 'recPercentGold' : 'recPercentSilver';

  const onGrTmChange = useCallback((text: string, onOzChange: (v: string) => void) => {
    if (text.trim() === '' || text === '-' || text === '.') {
      onOzChange(text);
      return;
    }
    const converted = grTmToOzTcInput(text);
    onOzChange(converted || text);
  }, []);

  return (
    <View>
      <MetalColumnHeader metal={metal} />
      <Controller
        control={control}
        name={ozField}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <>
            <TextInput
              mode="outlined"
              label="Ley oz/tc"
              value={value?.toString() ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              style={{ marginBottom: 4 }}
            />
            <TextInput
              mode="outlined"
              label="Ley gr/tm"
              value={ozTcToGrTmDisplay(value)}
              onChangeText={(t) => onGrTmChange(t, onChange)}
              keyboardType="decimal-pad"
              style={{ marginBottom: 4 }}
            />
            {error ? <HelperText type="error">{error.message}</HelperText> : null}
          </>
        )}
      />
      <FormNumberField control={control} name={recField} label="REC %" />
      <CatalogValueHint hint={recCurrentHint ?? null} />
    </View>
  );
}
