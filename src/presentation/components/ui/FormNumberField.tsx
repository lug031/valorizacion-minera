import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextInput, HelperText } from 'react-native-paper';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
}

export function FormNumberField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <>
          <TextInput
            mode="outlined"
            label={label}
            value={value?.toString() ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            disabled={disabled}
            style={{ marginBottom: 4 }}
            dense={false}
          />
          {error ? <HelperText type="error">{error.message}</HelperText> : null}
        </>
      )}
    />
  );
}
