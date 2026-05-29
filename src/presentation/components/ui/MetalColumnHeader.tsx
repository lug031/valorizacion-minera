import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { cotizadorColors, cotizadorStyles } from '../../theme/cotizador-styles';

interface Props {
  metal: 'gold' | 'silver';
}

export function MetalColumnHeader({ metal }: Props) {
  const isGold = metal === 'gold';
  return (
    <View
      style={[
        cotizadorStyles.metalHeader,
        isGold ? cotizadorStyles.metalHeaderGold : cotizadorStyles.metalHeaderSilver,
      ]}
    >
      <Text
        style={[
          cotizadorStyles.metalHeaderText,
          { color: isGold ? cotizadorColors.metalGold : cotizadorColors.metalSilver },
        ]}
      >
        {isGold ? 'ORO (AU)' : 'PLATA (AG)'}
      </Text>
    </View>
  );
}
