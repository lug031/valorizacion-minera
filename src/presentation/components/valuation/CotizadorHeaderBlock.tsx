import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import { Controller, useWatch, type Control } from 'react-hook-form';
import type { ValuationFormValues } from '../../forms/valuation-form-schema';
import { formatDisplayDate } from '../../utils/format';
import { cotizadorStyles } from '../../theme/cotizador-styles';
import { useConfigStore } from '../../store/config-store';
import {
  formatMaterialTypeButtonLabel,
  formatMaterialTypePickerLabel,
  getMaterialTypesForValuationPicker,
} from '../../utils/material-type-options';

const headerInputTheme = {
  colors: {
    onSurface: '#ffffff',
    onSurfaceVariant: '#d8e6f4',
    primary: '#c9a227',
  },
};

interface Props {
  control: Control<ValuationFormValues>;
  /** Fecha de cotización / última modificación — solo lectura. */
  fechaReadOnly?: boolean;
}

export function CotizadorHeaderBlock({ control, fechaReadOnly = true }: Props) {
  const [matMenuOpen, setMatMenuOpen] = useState(false);
  const materialTypes = useConfigStore((s) => s.materialTypes);
  const isHydrated = useConfigStore((s) => s.isHydrated);

  const selectedMat = useWatch({ control, name: 'materialTypeCode' });

  const matOptions = useMemo(
    () => getMaterialTypesForValuationPicker(materialTypes, isHydrated, selectedMat),
    [materialTypes, isHydrated, selectedMat]
  );

  return (
    <View style={cotizadorStyles.headerBar}>
      <Controller
        control={control}
        name="code"
        render={({ field: { value, onChange } }) => (
          <View>
            <Text style={styles.fieldLabel}>Código</Text>
            <TextInput
              mode="flat"
              value={value}
              onChangeText={onChange}
              textColor="#ffffff"
              placeholder="Ej. VAL-2026-001"
              placeholderTextColor="#9eb5cc"
              underlineColor="#6a8aab"
              activeUnderlineColor="#c9a227"
              theme={headerInputTheme}
              style={styles.codeInput}
              contentStyle={styles.codeContent}
            />
          </View>
        )}
      />
      <View style={cotizadorStyles.headerRow}>
        <Controller
          control={control}
          name="fecha"
          render={({ field: { value, onChange } }) => (
            <View style={{ flex: 1, minWidth: 140 }}>
              <Text style={styles.fieldLabel}>Fecha</Text>
              {fechaReadOnly ? (
                <View style={styles.readonlyDateWrap}>
                  <Text style={styles.readonlyDateValue}>
                    {value ? formatDisplayDate(value) : '—'}
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    mode="flat"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9eb5cc"
                    value={value}
                    onChangeText={onChange}
                    textColor="#ffffff"
                    underlineColor="#6a8aab"
                    activeUnderlineColor="#c9a227"
                    theme={headerInputTheme}
                    dense
                    style={styles.flatInput}
                  />
                  {value ? (
                    <Text style={styles.dateHint}>{formatDisplayDate(value)}</Text>
                  ) : null}
                </>
              )}
            </View>
          )}
        />
        <Controller
          control={control}
          name="materialTypeCode"
          render={({ field: { value, onChange } }) => (
            <View>
              <Text style={styles.fieldLabel}>Tipo MAT</Text>
              <Menu
                visible={matMenuOpen}
                onDismiss={() => setMatMenuOpen(false)}
                anchor={
                  <Button
                    mode="outlined"
                    textColor="#ffffff"
                    style={{ borderColor: '#c9a227', marginTop: 2 }}
                    onPress={() => setMatMenuOpen(true)}
                  >
                    {formatMaterialTypeButtonLabel(value, materialTypes, isHydrated)}
                  </Button>
                }
              >
                {matOptions.map((mat) => (
                  <Menu.Item
                    key={mat.id}
                    onPress={() => {
                      onChange(mat.code);
                      setMatMenuOpen(false);
                    }}
                    title={formatMaterialTypePickerLabel(mat)}
                  />
                ))}
              </Menu>
            </View>
          )}
        />
      </View>
      <Controller
        control={control}
        name="providerName"
        render={({ field: { value, onChange } }) => (
          <View style={styles.providerWrap}>
            <Text style={styles.fieldLabel}>Proveedor / cliente</Text>
            <TextInput
              mode="flat"
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="Opcional"
              placeholderTextColor="#9eb5cc"
              textColor="#ffffff"
              underlineColor="#6a8aab"
              activeUnderlineColor="#c9a227"
              theme={headerInputTheme}
              dense
              style={styles.flatInput}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: '#d8e6f4',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  codeInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    marginTop: 0,
  },
  codeContent: {
    fontWeight: '800',
    fontSize: 18,
    color: '#ffffff',
  },
  flatInput: {
    backgroundColor: 'transparent',
    height: 40,
    paddingHorizontal: 0,
  },
  readonlyDateWrap: {
    marginTop: 4,
    minHeight: 40,
    justifyContent: 'center',
  },
  readonlyDateValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateHint: {
    color: '#9eb5cc',
    fontSize: 11,
    marginTop: 2,
  },
  providerWrap: {
    marginTop: 6,
  },
});
