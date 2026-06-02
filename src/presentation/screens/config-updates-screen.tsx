import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { router, Stack, useFocusEffect } from 'expo-router';
import { screenPadding } from '../theme/app-theme';
import { useSyncStore } from '../store/sync-store';
import { SyncStatusBanners } from '../components/config/SyncStatusBanners';
import { CommercialCatalogRowView } from '../components/config/CommercialCatalogRowView';
import { setLastSeenChangelogSyncAt } from '../../infrastructure/config/changelog-seen-store';
import { captureConfigSnapshot } from '../../services/sync/config-sync-snapshot';
import type { ConfigSyncSnapshot } from '../../services/sync/config-sync-snapshot';
import { formatConfigChangeTimestamp } from '../utils/format-config-changelog';
import {
  buildCommercialCatalogView,
  countCatalogChanges,
  countCatalogRows,
} from '../utils/build-commercial-catalog-view';

export function ConfigUpdatesScreen() {
  const metadata = useSyncStore((s) => s.metadata);
  const hydrate = useSyncStore((s) => s.hydrate);
  const changelog = metadata?.configChangelog;
  const lastSyncAt = metadata?.lastSyncAt ?? null;
  const [snapshot, setSnapshot] = useState<ConfigSyncSnapshot | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const snap = await captureConfigSnapshot();
      setSnapshot(snap);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
    void loadCatalog();
  }, [hydrate, loadCatalog]);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
      const changelogSyncAt = useSyncStore.getState().metadata?.configChangelog?.syncAt;
      if (changelogSyncAt) {
        void setLastSeenChangelogSyncAt(changelogSyncAt);
      }
    }, [loadCatalog])
  );

  const sections = useMemo(
    () => (snapshot ? buildCommercialCatalogView(snapshot, changelog) : []),
    [snapshot, changelog]
  );

  const totalRows = countCatalogRows(sections);
  const totalChanges = countCatalogChanges(sections);

  return (
    <>
      <Stack.Screen options={{ title: 'Actualizaciones comerciales', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="bodyMedium" style={styles.hint}>
          Valores maestros descargados de la web en este teléfono. Los resaltados cambiaron en la última
          sincronización; el resto se muestra alineado sin cambios.
        </Text>

        <SyncStatusBanners showValuationOutbox={false} />

        {lastSyncAt ? (
          <Text variant="bodySmall" style={styles.syncLine}>
            Última actualización en este teléfono: {formatConfigChangeTimestamp(lastSyncAt)}
          </Text>
        ) : null}

        {changelog?.syncAt ? (
          <Text variant="bodySmall" style={styles.changelogSync}>
            Última comparación: {formatConfigChangeTimestamp(changelog.syncAt)}
            {totalRows > 0
              ? ` · ${totalChanges} cambio${totalChanges === 1 ? '' : 's'} de ${totalRows} valores`
              : ''}
          </Text>
        ) : null}

        {loadingCatalog ? (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text variant="bodySmall" style={styles.loadingText}>
              Cargando catálogo comercial…
            </Text>
          </View>
        ) : !snapshot?.appSettings && totalRows === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Sin datos de la web</Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                Active internet y espere la sincronización automática. Luego vuelva a esta pantalla.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          sections.map((section) => (
            <Card key={section.category} style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium">{section.title}</Text>
                  {section.changedCount > 0 ? (
                    <Text variant="labelSmall" style={styles.sectionBadge}>
                      {section.changedCount} cambio{section.changedCount === 1 ? '' : 's'}
                    </Text>
                  ) : (
                    <Text variant="labelSmall" style={styles.sectionOk}>
                      Sin cambios
                    </Text>
                  )}
                </View>
                {section.rows.map((row) => (
                  <CommercialCatalogRowView key={row.id} row={row} />
                ))}
              </Card.Content>
            </Card>
          ))
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
  changelogSync: { fontWeight: '600', marginBottom: 4, color: '#1a3a5c' },
  loading: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  loadingText: { opacity: 0.7 },
  card: { borderRadius: 12 },
  emptyText: { marginTop: 8, opacity: 0.75, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  sectionBadge: {
    color: '#b45309',
    fontWeight: '700',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectionOk: {
    color: '#64748b',
    opacity: 0.85,
  },
  back: { marginTop: 8 },
});
