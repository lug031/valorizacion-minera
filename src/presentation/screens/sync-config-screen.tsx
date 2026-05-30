import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { Stack } from 'expo-router';
import { screenPadding } from '../theme/app-theme';
import { useSyncStore } from '../store/sync-store';
import { useSettingsStore } from '../store/settings-store';
import { InterMetadataSummary } from '../components/settings/InterMetadataSummary';
import {
  buildSyncRecordRows,
  syncRecordsCardSubtitle,
  syncRecordsCardTitle,
} from '../utils/sync-records-display';

function formatTimestamp(value: string | null): string {
  if (!value) return 'Aún no sincronizado';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'syncing':
      return 'Sincronizando';
    case 'success':
      return 'Éxito';
    case 'error':
      return 'Error';
    case 'offline':
      return 'Sin conexión';
    default:
      return 'Sin sincronizar';
  }
}

export function SyncConfigScreen() {
  const metadata = useSyncStore((s) => s.metadata);
  const loading = useSyncStore((s) => s.loading);
  const hydrating = useSyncStore((s) => s.hydrating);
  const hydrate = useSyncStore((s) => s.hydrate);
  const syncNow = useSyncStore((s) => s.syncNow);
  const settings = useSettingsStore();
  const recordRows = buildSyncRecordRows(metadata);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <>
      <Stack.Screen options={{ title: 'Sincronizar configuración', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="bodyMedium" style={styles.hint}>
          Descarga configuración maestra desde la web y la guarda en SQLite para seguir operando offline.
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Estado</Text>
            <Text style={styles.value}>{statusLabel(metadata?.status)}</Text>
            <Text variant="bodySmall" style={styles.label}>
              Última sincronización
            </Text>
            <Text style={styles.value}>{formatTimestamp(metadata?.lastSyncAt ?? null)}</Text>
            {metadata?.bundleVersion ? (
              <>
                <Text variant="bodySmall" style={styles.label}>
                  Versión de bundle
                </Text>
                <Text style={styles.valueSmall}>{metadata.bundleVersion}</Text>
              </>
            ) : null}
            {metadata?.errorMessage ? (
              <Text style={styles.error}>{metadata.errorMessage}</Text>
            ) : null}
            {metadata?.validationIssues && metadata.validationIssues.length > 0 ? (
              <View style={styles.issuesBox}>
                <Text variant="bodySmall" style={styles.label}>
                  Detalle del bundle (nube)
                </Text>
                {metadata.validationIssues.map((issue) => (
                  <Text key={issue} style={styles.issueItem}>
                    • {issue}
                  </Text>
                ))}
                <Text style={styles.preserveHint}>
                  No se modificó la configuración local. Se conserva la última versión válida.
                </Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{syncRecordsCardTitle(metadata?.status)}</Text>
            {syncRecordsCardSubtitle(metadata?.status) ? (
              <Text variant="bodySmall" style={styles.cardSubtitle}>
                {syncRecordsCardSubtitle(metadata?.status)}
              </Text>
            ) : null}
            {recordRows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Precio internacional (INTER)</Text>
            <Text variant="bodySmall" style={styles.label}>
              Valores maestros sincronizados desde la web (referencia para nuevas cotizaciones).
            </Text>
            <InterMetadataSummary
              interGold={settings.interGold}
              interSilver={settings.interSilver}
              meta={{
                interGoldSource: settings.interGoldSource,
                interSilverSource: settings.interSilverSource,
                interGoldFetchedAt: settings.interGoldFetchedAt,
                interSilverFetchedAt: settings.interSilverFetchedAt,
                interFetchStatus: settings.interFetchStatus,
                interFetchError: settings.interFetchError,
              }}
              lastSyncAt={metadata?.lastSyncAt ?? null}
              compact
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          loading={loading}
          disabled={loading || hydrating}
          onPress={() => void syncNow()}
          contentStyle={styles.btnContent}
        >
          Sincronizar ahora
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: screenPadding, paddingBottom: 40, gap: 12 },
  hint: { opacity: 0.75, marginBottom: 4 },
  card: { borderRadius: 12 },
  cardSubtitle: { marginTop: 4, marginBottom: 4, opacity: 0.7, lineHeight: 18 },
  label: { marginTop: 8, opacity: 0.7 },
  value: { marginTop: 2, fontWeight: '600' },
  valueSmall: { marginTop: 2, fontSize: 12, opacity: 0.85 },
  error: { marginTop: 8, color: '#b42318' },
  issuesBox: { marginTop: 10, gap: 4 },
  issueItem: { color: '#b42318', fontSize: 13 },
  preserveHint: { marginTop: 6, fontSize: 12, opacity: 0.75 },
  row: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowValue: { fontWeight: '600' },
  btnContent: { paddingVertical: 10 },
});
