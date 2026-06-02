import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthUser } from '../../src/presentation/services/auth/auth-service';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useValuationDraftStore } from '../../src/presentation/store/valuation-draft-store';
import { useSyncStore } from '../../src/presentation/store/sync-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { canManageSettings } from '../../src/presentation/utils/role-access';
import { SyncStatusBanners } from '../../src/presentation/components/config/SyncStatusBanners';
import { canUseScenarioComparison } from '../../src/config/scenario-comparison-access';
import { getLastSeenChangelogSyncAt } from '../../src/infrastructure/config/changelog-seen-store';
import { unreadCommercialUpdatesCount } from '../../src/presentation/utils/commercial-updates-unread';
import { loadCommercialDefaultsForValuation } from '../../src/services/sync/load-commercial-defaults';
import { scheduleForegroundSync } from '../../src/services/sync/foreground-sync.service';

function roleDisplayLabel(role: AuthUser['role'] | undefined): string {
  if (role === 'admin') return 'Administrador';
  if (role === 'operador') return 'Operador';
  return 'Usuario';
}

function sessionSubtitle(user: AuthUser | null | undefined): string {
  return `Rol: ${roleDisplayLabel(user?.role)}`;
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const syncMetadata = useSyncStore((s) => s.metadata);
  const hydrateSync = useSyncStore((s) => s.hydrate);
  const initDraft = useValuationDraftStore((s) => s.initDraft);
  const isAdmin = canManageSettings(user?.role);
  const comparisonProductEnabled = canUseScenarioComparison();
  const showSeedBootstrapBanner =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    isAdmin &&
    user?.authSource === 'local_seed';
  const [unreadUpdates, setUnreadUpdates] = useState(0);
  const [startingValuation, setStartingValuation] = useState(false);

  const refreshUnread = useCallback(async () => {
    await hydrateSync();
    const lastSeen = await getLastSeenChangelogSyncAt();
    setUnreadUpdates(unreadCommercialUpdatesCount(useSyncStore.getState().metadata, lastSeen));
  }, [hydrateSync]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnread();
      scheduleForegroundSync();
    }, [refreshUnread])
  );

  useEffect(() => {
    void refreshUnread();
  }, [syncMetadata?.configChangelog?.syncAt, refreshUnread]);

  const startNew = async (comparisonEnabled: boolean) => {
    setStartingValuation(true);
    try {
      const defaults = await loadCommercialDefaultsForValuation({ force: true });
      initDraft(defaults, { comparisonEnabled });
      router.push('/(app)/valorizacion/nueva');
    } finally {
      setStartingValuation(false);
    }
  };

  const updatesLabel =
    unreadUpdates > 0
      ? `Actualizaciones comerciales (${unreadUpdates} nuevo${unreadUpdates === 1 ? '' : 's'})`
      : 'Actualizaciones comerciales';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <ScreenHeader
          title={`Hola, ${user?.displayName ?? 'Usuario'}`}
          subtitle={sessionSubtitle(user)}
        />
        <SyncStatusBanners showValuationOutbox />
        {showSeedBootstrapBanner ? (
          <View style={styles.banner}>
            <Text variant="bodySmall" style={styles.bannerText}>
              Modo desarrollo: la cuenta local de prueba no sincroniza cotizaciones con el servidor. Cree su usuario en la
              web, active el dispositivo e ingrese con ese usuario (no use la cuenta seed en release).
            </Text>
          </View>
        ) : null}
        <Button
          mode="contained"
          loading={startingValuation}
          disabled={startingValuation}
          onPress={() => void startNew(false)}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Nueva valorización
        </Button>
        {comparisonProductEnabled ? (
          <Button
            mode="outlined"
            loading={startingValuation}
            disabled={startingValuation}
            onPress={() => void startNew(true)}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Cotización con comparación de escenarios
          </Button>
        ) : null}
        <Button mode="outlined" onPress={() => router.push('/(app)/historial')} style={styles.btn} contentStyle={styles.btnContent}>
          Historial de cotizaciones
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push('/(app)/configuracion')}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          {updatesLabel}
        </Button>
        <Button mode="text" onPress={async () => { await logout(); router.replace('/(auth)/login'); }} style={{ marginTop: 24 }}>
          Cerrar sesión
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f8' },
  inner: { flex: 1, padding: screenPadding },
  banner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  bannerText: { lineHeight: 18, color: '#9a3412' },
  btn: { marginBottom: 12 },
  btnContent: { paddingVertical: 10 },
});
