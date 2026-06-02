import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { router, Stack, useFocusEffect } from 'expo-router';
import { screenPadding } from '../theme/app-theme';
import { useSyncStore } from '../store/sync-store';
import { SyncStatusBanners } from '../components/config/SyncStatusBanners';
import { CommercialCatalogRowView } from '../components/config/CommercialCatalogRowView';
import { CotizadorSection } from '../components/ui/CotizadorSection';
import { setLastSeenChangelogSyncAt } from '../../infrastructure/config/changelog-seen-store';
import { captureConfigSnapshot } from '../../services/sync/config-sync-snapshot';
import type { ConfigSyncSnapshot } from '../../services/sync/config-sync-snapshot';
import { formatConfigChangeTimestamp } from '../utils/format-config-changelog';
import {
  buildCommercialCatalogView,
  countCatalogChanges,
  countCatalogRows,
  type CommercialCatalogSection,
} from '../utils/build-commercial-catalog-view';
import { pruneConfigChangelog } from '../../services/sync/config-reference-baseline';
import { runMasterConfigSyncThrottled } from '../../services/sync/schedule-master-config-sync';

function CommercialCatalogSectionView({ section }: { section: CommercialCatalogSection }) {
  const isChangesOnly = section.displayMode === 'changes_only';
  const noChanges = section.changedCount === 0;

  return (
    <CotizadorSection title={section.title}>
      {isChangesOnly && noChanges ? (
        <Text variant="bodySmall" style={styles.noChanges}>
          Sin cambios
        </Text>
      ) : (
        section.rows.map((row) => <CommercialCatalogRowView key={row.id} row={row} />)
      )}
    </CotizadorSection>
  );
}

export function ConfigUpdatesScreen() {
  const metadata = useSyncStore((s) => s.metadata);
  const hydrate = useSyncStore((s) => s.hydrate);
  const configLoading = useSyncStore((s) => s.loading);
  const changelog = metadata?.configChangelog;
  const lastSyncAt = metadata?.lastSyncAt ?? null;
  const [snapshot, setSnapshot] = useState<ConfigSyncSnapshot | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const snap = await captureConfigSnapshot();
      setSnapshot(snap);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const markChangelogSeen = useCallback(async () => {
    const changelogSyncAt = useSyncStore.getState().metadata?.configChangelog?.syncAt;
    if (changelogSyncAt) {
      await setLastSeenChangelogSyncAt(changelogSyncAt);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    try {
      await runMasterConfigSyncThrottled({ force: true });
      await hydrate();
      await loadCatalog();
      await markChangelogSeen();
    } finally {
      setChecking(false);
    }
  }, [hydrate, loadCatalog, markChangelogSeen]);

  useFocusEffect(
    useCallback(() => {
      void hydrate();
      void loadCatalog();
      void markChangelogSeen();
    }, [hydrate, loadCatalog, markChangelogSeen])
  );

  useEffect(() => {
    void loadCatalog();
  }, [lastSyncAt, changelog?.syncAt, loadCatalog]);

  const sections = useMemo(() => {
    if (!snapshot) return [];
    const prunedChangelog = pruneConfigChangelog(changelog, snapshot);
    return buildCommercialCatalogView(snapshot, prunedChangelog);
  }, [snapshot, changelog]);

  const totalRows = countCatalogRows(sections);
  const totalChanges = countCatalogChanges(sections);
  const busy = loadingCatalog || configLoading || checking;
  const syncFailed = metadata?.status === 'error' && metadata.errorMessage;
  const hasCatalog = Boolean(snapshot?.appSettings);

  return (
    <>
      <Stack.Screen options={{ title: 'Actualizaciones comerciales', headerShown: true }} />
      <ScrollView
        style={styles.scrollBg}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={checking} onRefresh={() => void checkForUpdates()} />
        }
      >
        <Text variant="bodyMedium" style={styles.hint}>
          Valores maestros descargados de la web en este teléfono. Los resaltados cambiaron en la
          última sincronización.
        </Text>

        <SyncStatusBanners showValuationOutbox={false} showCommercialConfigStatus />

        {syncFailed ? (
          <View style={styles.errorBox}>
            <Text variant="titleSmall" style={styles.errorTitle}>
              No se pudo conectar con la web
            </Text>
            <Text variant="bodySmall" style={styles.errorText}>
              {metadata.errorMessage}
            </Text>
          </View>
        ) : null}

        {lastSyncAt ? (
          <Text variant="bodySmall" style={styles.metaLine}>
            Última descarga: {formatConfigChangeTimestamp(lastSyncAt)}
            {changelog?.syncAt && totalChanges > 0
              ? ` · ${totalChanges} cambio${totalChanges === 1 ? '' : 's'} en la última comparación`
              : ''}
          </Text>
        ) : null}

        <Button
          mode="outlined"
          loading={checking}
          disabled={busy}
          onPress={() => void checkForUpdates()}
          style={styles.refreshBtn}
        >
          Comprobar actualizaciones
        </Button>

        {busy && !snapshot ? (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text variant="bodySmall" style={styles.loadingText}>
              {checking || configLoading ? 'Comprobando valores comerciales…' : 'Cargando catálogo…'}
            </Text>
          </View>
        ) : !hasCatalog && totalRows === 0 ? (
          <CotizadorSection title="Catálogo comercial">
            <Text variant="bodySmall" style={styles.emptyText}>
              Espere la sincronización automática con internet o pulse «Comprobar actualizaciones».
            </Text>
          </CotizadorSection>
        ) : (
          sections.map((section) => (
            <CommercialCatalogSectionView key={section.category} section={section} />
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
  scrollBg: { backgroundColor: '#e8ecf0' },
  container: { padding: screenPadding, paddingBottom: 40, gap: 4 },
  hint: { opacity: 0.8, lineHeight: 20, marginBottom: 8 },
  metaLine: { opacity: 0.75, marginBottom: 8 },
  refreshBtn: { marginBottom: 12, alignSelf: 'flex-start' },
  loading: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  loadingText: { opacity: 0.7 },
  errorBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  errorTitle: { color: '#991b1b', fontWeight: '700' },
  errorText: { marginTop: 6, color: '#991b1b', lineHeight: 18 },
  emptyText: { opacity: 0.75, lineHeight: 18 },
  noChanges: {
    opacity: 0.75,
    color: '#64748b',
    paddingVertical: 4,
  },
  back: { marginTop: 8 },
});
