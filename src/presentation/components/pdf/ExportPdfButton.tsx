import { View, StyleSheet } from 'react-native';
import { Button, HelperText } from 'react-native-paper';

interface Props {
  onPress: () => void;
  loading?: boolean;
  error?: string | null;
  label?: string;
  mode?: 'contained' | 'outlined';
}

export function ExportPdfButton({
  onPress,
  loading = false,
  error,
  label = 'Exportar preliquidación en PDF',
  mode = 'outlined',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Button
        mode={mode}
        icon="file-pdf-box"
        onPress={onPress}
        loading={loading}
        disabled={loading}
        style={styles.btn}
        contentStyle={styles.btnContent}
      >
        {loading ? 'Generando PDF…' : label}
      </Button>
      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  btn: {},
  btnContent: { paddingVertical: 8 },
});
