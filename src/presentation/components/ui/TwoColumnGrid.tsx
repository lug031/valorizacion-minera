import { View, useWindowDimensions } from 'react-native';
import { cotizadorStyles } from '../../theme/cotizador-styles';

const TWO_COL_MIN_WIDTH = 360;

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  stackOnNarrow?: boolean;
}

/** Dos columnas AU/AG; en pantallas estrechas puede apilar si stackOnNarrow. */
export function TwoColumnGrid({ left, right, stackOnNarrow = false }: Props) {
  const { width } = useWindowDimensions();
  const useRow = width >= TWO_COL_MIN_WIDTH || !stackOnNarrow;

  if (!useRow) {
    return (
      <View>
        <View style={{ marginBottom: 8 }}>{left}</View>
        <View>{right}</View>
      </View>
    );
  }

  return (
    <View style={cotizadorStyles.twoCol}>
      <View style={cotizadorStyles.col}>{left}</View>
      <View style={cotizadorStyles.col}>{right}</View>
    </View>
  );
}
