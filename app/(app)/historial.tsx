import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import type { ValuationListItem } from '../../src/domain/models/valuation';
import type { ValuationSyncQueueCounts } from '../../src/data/repositories/valuation-sync-queue';
import { valuationRepository } from '../../src/data/repositories';
import { valuationAppService } from '../../src/data/repositories';
import { formatDisplayDate, formatMoney } from '../../src/presentation/utils/format';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import {
  syncPendingValuations,
  waitForValuationSyncIfRunning,
} from '../../src/services/sync/sync-valuations.service';
import { formatValuationSyncAlert } from '../../src/services/sync/format-valuation-sync-alert';
import { ValuationPanelSyncBadge } from '../../src/presentation/components/valuation/ValuationPanelSyncBadge';
import { resolveHistorialSendUi } from '../../src/presentation/utils/historial-send-ui';
import { SAVE_OFFLINE_HISTORIAL_NOTICE } from '../../src/presentation/utils/format-sync-queue-summary';

export default function HistorialScreen() {
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const lastSaveNoticeKey = useRef<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [items, setItems] = useState<ValuationListItem[]>([]);
  const [codeFilter, setCodeFilter] = useState('');
  const [fechaFrom, setFechaFrom] = useState('');
  const [fechaTo, setFechaTo] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [syncQueue, setSyncQueue] = useState<ValuationSyncQueueCounts>({
    pending: 0,
    syncing: 0,
    error: 0,
    skippedNoCloudUser: 0,
  });

  const sendUi = resolveHistorialSendUi(syncQueue, isConnected);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setListLoading(true);
    try {
      const [list, queue] = await Promise.all([
        valuationAppService.search({
          code: codeFilter || undefined,
          fechaFrom: fechaFrom || undefined,
          fechaTo: fechaTo || undefined,
        }),
        valuationRepository.countSyncQueue(),
      ]);
      setItems(list);
      setSyncQueue(queue);
    } finally {
      if (!options?.silent) setListLoading(false);
    }
  }, [codeFilter, fechaFrom, fechaTo]);

  const sendPending = useCallback(() => {
    void (async () => {
      setSyncing(true);
      try {
        const result = await syncPendingValuations();
        const queueAfter = await valuationRepository.countSyncQueue();
        await load();
        const { title, message } = formatValuationSyncAlert(result, { queueAfter });
        Alert.alert(title, message);
      } finally {
        setSyncing(false);
      }
    })();
  }, [load]);

  useEffect(() => {
    const refreshNet = () => {
      void NetInfo.fetch().then((state) => {
        setIsConnected(state.isConnected ?? false);
      });
    };
    refreshNet();
    const sub = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      if (connected) {
        void waitForValuationSyncIfRunning().then(() => load({ silent: true }));
      }
    });
    return () => sub();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (saved && saved !== lastSaveNoticeKey.current) {
        lastSaveNoticeKey.current = saved;
        setSaveNotice(SAVE_OFFLINE_HISTORIAL_NOTICE);
      }

      let active = true;
      void (async () => {
        await load();
        if (!active) return;
        await waitForValuationSyncIfRunning();
        if (active) await load({ silent: true });
      })();
      return () => {
        active = false;
      };
    }, [load, saved])
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Historial', headerShown: true }} />
      <View style={styles.wrap}>
        {saveNotice ? (
          <View style={styles.saveNoticeBanner}>
            <Text variant="bodySmall" style={styles.saveNoticeText}>
              {saveNotice}
            </Text>
            <Button compact onPress={() => setSaveNotice(null)}>
              Cerrar
            </Button>
          </View>
        ) : null}
        {sendUi?.showBanner ? (
          <View style={styles.outboxBanner}>
            <Text variant="bodySmall" style={styles.outboxHint}>
              {sendUi.bannerText}
            </Text>
            {sendUi.showSendButton ? (
              <Button
                mode="contained"
                loading={syncing}
                disabled={syncing}
                onPress={sendPending}
                style={styles.sendBtn}
                contentStyle={styles.sendBtnContent}
              >
                {sendUi.sendButtonLabel}
              </Button>
            ) : null}
          </View>
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
        <Button mode="contained-tonal" onPress={() => void load()} style={{ marginBottom: 8 }}>
          Buscar
        </Button>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            listLoading ? (
              <View style={styles.listLoading}>
                <ActivityIndicator size="small" />
                <Text style={styles.listLoadingText}>Cargando historial…</Text>
              </View>
            ) : (
              <Text style={styles.empty}>Sin valorizaciones guardadas.</Text>
            )
          }
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/historial/[id]', params: { id: item.id } })}
            >
              <Card.Content>
                <Text variant="titleMedium">{item.code}</Text>
                <Text>
                  {formatDisplayDate(item.createdAt)} · {item.materialTypeCode}
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
  saveNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  saveNoticeText: { flex: 1, color: '#065f46', lineHeight: 18 },
  outboxBanner: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 10,
  },
  outboxHint: { color: '#9a3412', lineHeight: 20 },
  sendBtn: { alignSelf: 'stretch', marginTop: 2 },
  sendBtnContent: { paddingVertical: 6 },
  search: { marginBottom: 8 },
  card: { marginBottom: 10 },
  total: { fontWeight: '700', marginTop: 6 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 24 },
  listLoading: { alignItems: 'center', marginTop: 32, gap: 10 },
  listLoadingText: { opacity: 0.65 },
});
