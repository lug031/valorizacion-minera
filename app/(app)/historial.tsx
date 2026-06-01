import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { router, Stack, useFocusEffect } from 'expo-router';
import type { ValuationListItem } from '../../src/domain/models/valuation';
import { valuationRepository } from '../../src/data/repositories';
import { valuationAppService } from '../../src/data/repositories';
import { formatDisplayDate, formatMoney } from '../../src/presentation/utils/format';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { syncPendingValuations } from '../../src/services/sync/sync-valuations.service';
import { formatValuationSyncAlert } from '../../src/services/sync/format-valuation-sync-alert';
import { ValuationPanelSyncBadge } from '../../src/presentation/components/valuation/ValuationPanelSyncBadge';
import { formatSyncQueueBanner } from '../../src/presentation/utils/format-sync-queue-summary';

export default function HistorialScreen() {
  const [items, setItems] = useState<ValuationListItem[]>([]);
  const [codeFilter, setCodeFilter] = useState('');
  const [fechaFrom, setFechaFrom] = useState('');
  const [fechaTo, setFechaTo] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [outboxHint, setOutboxHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, queue] = await Promise.all([
      valuationAppService.search({
        code: codeFilter || undefined,
        fechaFrom: fechaFrom || undefined,
        fechaTo: fechaTo || undefined,
      }),
      valuationRepository.countSyncQueue(),
    ]);
    setItems(list);
    setOutboxHint(formatSyncQueueBanner(queue));
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
        {outboxHint ? (
          <Text variant="bodySmall" style={styles.outboxHint}>
            {outboxHint}.
          </Text>
        ) : null}
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
        <Button mode="contained-tonal" onPress={load} style={{ marginBottom: 8 }}>
          Buscar
        </Button>
        <Button
          mode="outlined"
          loading={syncing}
          disabled={syncing}
          onPress={() => {
            void (async () => {
              setSyncing(true);
              try {
                const result = await syncPendingValuations();
                await load();
                const { title, message } = formatValuationSyncAlert(result);
                Alert.alert(title, message);
              } finally {
                setSyncing(false);
              }
            })();
          }}
          style={{ marginBottom: 12 }}
        >
          Enviar al panel
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
                <Text>
                  {formatDisplayDate(item.createdAt.slice(0, 10))} · {item.materialTypeCode}
                </Text>
                {item.providerName ? <Text>{item.providerName}</Text> : null}
                <Text>TMS: {item.tms ?? '—'}</Text>
                <Text style={styles.total}>Total: {formatMoney(item.valorCompraTotalScenarioA)}</Text>
                <ValuationPanelSyncBadge status={item.syncStatus} errorMessage={item.syncError} />
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
  outboxHint: { marginBottom: 10, color: '#b45309', lineHeight: 18 },
});
