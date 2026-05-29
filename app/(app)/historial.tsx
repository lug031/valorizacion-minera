import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { router, Stack, useFocusEffect } from 'expo-router';
import type { ValuationListItem } from '../../src/domain/models/valuation';
import { valuationAppService } from '../../src/data/repositories';
import { formatOwnershipUsername } from '../../src/domain/constants/valuation-ownership';
import { formatDisplayDate, formatMoney } from '../../src/presentation/utils/format';
import { screenPadding } from '../../src/presentation/theme/app-theme';

export default function HistorialScreen() {
  const [items, setItems] = useState<ValuationListItem[]>([]);
  const [codeFilter, setCodeFilter] = useState('');
  const [fechaFrom, setFechaFrom] = useState('');
  const [fechaTo, setFechaTo] = useState('');

  const load = useCallback(async () => {
    const list = await valuationAppService.search({
      code: codeFilter || undefined,
      fechaFrom: fechaFrom || undefined,
      fechaTo: fechaTo || undefined,
    });
    setItems(list);
  }, [codeFilter, fechaFrom, fechaTo]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Historial', headerShown: true }} />
      <View style={styles.wrap}>
        <TextInput
          mode="outlined"
          label="Buscar por código"
          value={codeFilter}
          onChangeText={setCodeFilter}
          style={styles.search}
        />
        <TextInput
          mode="outlined"
          label="Fecha creación desde (YYYY-MM-DD)"
          value={fechaFrom}
          onChangeText={setFechaFrom}
          style={styles.search}
        />
        <TextInput
          mode="outlined"
          label="Fecha creación hasta (YYYY-MM-DD)"
          value={fechaTo}
          onChangeText={setFechaTo}
          style={styles.search}
        />
        <Button mode="contained-tonal" onPress={load} style={{ marginBottom: 12 }}>
          Buscar
        </Button>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>Sin valorizaciones guardadas.</Text>}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/historial/[id]', params: { id: item.id } })}
            >
              <Card.Content>
                <Text variant="titleMedium">{item.code}</Text>
                <Text>{formatDisplayDate(item.createdAt.slice(0, 10))} · {item.materialTypeCode}</Text>
                <Text>
                  Creado por: {formatOwnershipUsername(item.createdByUsername)}
                  {item.updatedByUsername !== item.createdByUsername
                    ? ` · Últ. ed.: ${formatOwnershipUsername(item.updatedByUsername)}`
                    : ''}
                </Text>
                {item.providerName ? <Text>{item.providerName}</Text> : null}
                <Text>TMS: {item.tms ?? '—'}</Text>
                <Text style={styles.total}>Total: {formatMoney(item.valorCompraTotalScenarioA)}</Text>
              </Card.Content>
            </Card>
          )}
        />
        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 8 }}>
          Volver
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: screenPadding },
  search: { marginBottom: 8 },
  card: { marginBottom: 10 },
  total: { fontWeight: '700', marginTop: 6 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 24 },
});
