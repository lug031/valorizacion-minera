import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { router, Stack, useFocusEffect } from 'expo-router';
import { screenPadding } from '../theme/app-theme';
import { useSyncStore } from '../store/sync-store';
import { SyncStatusBanners } from '../components/config/SyncStatusBanners';
import { setLastSeenChangelogSyncAt } from '../../infrastructure/config/changelog-seen-store';
import {
  configChangeCategoryLabel,
  formatConfigChangeTimestamp,
  formatConfigChangeValue,
} from '../utils/format-config-changelog';
import type { ConfigChangeEntry } from '../../services/sync/config-sync-changelog.types';

function groupByCategory(entries: ConfigChangeEntry[]) {
  const groups: Record<string, ConfigChangeEntry[]> = {};
  for (const entry of entries) {
    const key = entry.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

export function ConfigUpdatesScreen() {
  const metadata = useSyncStore((s) => s.metadata);
  const hydrate = useSyncStore((s) => s.hydrate);
  const changelog = metadata?.configChangelog;
  const lastSyncAt = metadata?.lastSyncAt ?? null;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useFocusEffect(
    useCallback(() => {
      const changelogSyncAt = useSyncStore.getState().metadata?.configChangelog?.syncAt;
      if (changelogSyncAt) {
        void setLastSeenChangelogSyncAt(changelogSyncAt);
      }
    }, [])
  );

  const grouped = useMemo(
    () => (changelog?.entries?.length ? groupByCategory(changelog.entries) : null),
    [changelog]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Actualizaciones comerciales', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="bodyMedium" style={styles.hint}>
          Los valores comerciales se actualizan solos con internet. Aquí puede revisar qué cambió en la
          última descarga desde la web antes de cotizar.
        </Text>

        <SyncStatusBanners showValuationOutbox={false} />

        {lastSyncAt ? (
          <Text variant="bodySmall" style={styles.syncLine}>
            Última actualización en este teléfono: {formatConfigChangeTimestamp(lastSyncAt)}
          </Text>
        ) : null}

        {!changelog?.entries?.length ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Sin cambios registrados</Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                Tras la próxima sincronización con internet, aquí aparecerán las diferencias respecto a la
                versión anterior en este dispositivo (INTER, factor, tipos MAT, maquila, etc.).
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Text variant="bodySmall" style={styles.changelogSync}>
              Cambios detectados al sincronizar: {formatConfigChangeTimestamp(changelog.syncAt)}
            </Text>
            {Object.entries(grouped ?? {}).map(([category, items]) => (
              <Card key={category} style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium">
                    {configChangeCategoryLabel(category as ConfigChangeEntry['category'])}
                  </Text>
                  {items.map((entry, index) => (
                    <View key={entry.id} style={styles.entry}>
                      {index > 0 ? <Divider style={styles.divider} /> : null}
                      <Text variant="labelLarge" style={styles.entryLabel}>
                        {entry.label}
                      </Text>
                      <View style={styles.row}>
                        <Text variant="bodySmall" style={styles.rowLabel}>
                          Valor anterior
                        </Text>
                        <Text style={styles.rowValue}>{formatConfigChangeValue(entry.previousValue)}</Text>
                      </View>
                      <Text variant="bodySmall" style={styles.dateLine}>
                        Registrado: {formatConfigChangeTimestamp(entry.previousRecordedAt)}
                      </Text>
                      <View style={styles.row}>
                        <Text variant="bodySmall" style={styles.rowLabel}>
                          Valor nuevo
                        </Text>
                        <Text style={[styles.rowValue, styles.newValue]}>
                          {formatConfigChangeValue(entry.newValue)}
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={styles.dateLine}>
                        En web / local: {formatConfigChangeTimestamp(entry.newRecordedAt)}
                      </Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            ))}
          </>
        )}

        <Button mode="text" onPress={() => router.back()} style={styles.back}>
          Volver
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: screenPadding, paddingBottom: 40, gap: 12 },
  hint: { opacity: 0.8, lineHeight: 20, marginBottom: 4 },
  syncLine: { opacity: 0.75, marginBottom: 4 },
  changelogSync: { fontWeight: '600', marginBottom: 4 },
  card: { borderRadius: 12 },
  emptyText: { marginTop: 8, opacity: 0.75, lineHeight: 18 },
  entry: { marginTop: 12 },
  divider: { marginBottom: 12 },
  entryLabel: { fontWeight: '700', marginBottom: 6 },
  row: { marginTop: 4 },
  rowLabel: { opacity: 0.7 },
  rowValue: { fontWeight: '600', marginTop: 2 },
  newValue: { color: '#1a3a5c' },
  dateLine: { opacity: 0.65, marginTop: 2, marginBottom: 6, fontSize: 11 },
  back: { marginTop: 8 },
});
