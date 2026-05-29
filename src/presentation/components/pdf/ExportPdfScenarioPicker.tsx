import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { formatMoney } from '../../utils/format';
import type { ExportScenarioOption } from '../../utils/export-scenario-options';

interface Props {
  scenarios: ExportScenarioOption[];
  loading?: boolean;
  error?: string | null;
  onExport: (scenarioIndex: number) => void;
  label?: string;
}

/**
 * Exportación PDF: una acción directa si hay un solo escenario;
 * con comparación A/B/C muestra opciones debajo del botón principal.
 * Feature preparada para futuras versiones comerciales.
 */
export function ExportPdfScenarioPicker({
  scenarios,
  loading = false,
  error,
  onExport,
  label = 'Exportar preliquidación en PDF',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasChoice = scenarios.length > 1;

  const handleMainPress = () => {
    if (loading) return;
    if (!hasChoice) {
      onExport(0);
      return;
    }
    setExpanded((v) => !v);
  };

  const handlePick = (index: number) => {
    setExpanded(false);
    onExport(index);
  };

  return (
    <View style={styles.wrap}>
      <Button
        mode="outlined"
        icon="file-pdf-box"
        onPress={handleMainPress}
        loading={loading}
        disabled={loading}
        contentStyle={styles.btnContent}
      >
        {loading ? 'Generando PDF…' : label}
      </Button>

      {hasChoice && expanded && !loading ? (
        <View style={styles.options}>
          <Text variant="labelMedium" style={styles.optionsTitle}>
            Seleccione escenario a exportar
          </Text>
          {scenarios.map((sc, index) => (
            <Button
              key={sc.label}
              mode="contained-tonal"
              icon="file-export-outline"
              onPress={() => handlePick(index)}
              style={styles.optionBtn}
              contentStyle={styles.optionContent}
            >
              {`Escenario ${sc.label} — ${sc.name} · ${formatMoney(sc.total)}`}
            </Button>
          ))}
        </View>
      ) : null}

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  btnContent: { paddingVertical: 8 },
  options: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b8c4d0',
    borderRadius: 4,
    gap: 6,
  },
  optionsTitle: {
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 4,
  },
  optionBtn: { marginVertical: 2 },
  optionContent: { paddingVertical: 6 },
});
