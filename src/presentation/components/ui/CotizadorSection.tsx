import { View, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { cotizadorStyles } from '../../theme/cotizador-styles';

interface Props {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CotizadorSection({ title, children, style }: Props) {
  return (
    <View style={[cotizadorStyles.sheet, style]}>
      <View style={cotizadorStyles.sectionTitleBar}>
        <Text style={cotizadorStyles.sectionTitleText}>{title}</Text>
      </View>
      <View style={cotizadorStyles.sectionBody}>{children}</View>
    </View>
  );
}
