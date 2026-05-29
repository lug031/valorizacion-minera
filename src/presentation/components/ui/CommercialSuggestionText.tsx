import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

/** Altura mínima solo para alinear INTER entre columnas cuando hay texto RC. */
export const COMMERCIAL_SUGGESTION_SLOT_HEIGHT = 20;

interface Props {
  text: string | null;
  reserveSpace?: boolean;
}

/** Solo texto de sugerencia comercial debajo de un campo. */
export function CommercialSuggestionText({ text, reserveSpace = false }: Props) {
  if (!text && !reserveSpace) return null;

  return (
    <View
      style={[
        styles.slot,
        reserveSpace && !text ? styles.slotEmpty : null,
        text ? styles.slotWithText : null,
      ]}
    >
      {text ? (
        <Text variant="bodySmall" style={styles.text}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    justifyContent: 'flex-start',
  },
  slotWithText: {
    marginBottom: 2,
    minHeight: COMMERCIAL_SUGGESTION_SLOT_HEIGHT,
  },
  slotEmpty: {
    minHeight: COMMERCIAL_SUGGESTION_SLOT_HEIGHT,
    marginBottom: 2,
  },
  text: {
    color: '#2c5282',
    lineHeight: 16,
    fontSize: 11,
  },
});
