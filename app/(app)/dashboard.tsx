import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthUser } from '../../src/presentation/services/auth/auth-service';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useSettingsStore } from '../../src/presentation/store/settings-store';
import { useValuationDraftStore } from '../../src/presentation/store/valuation-draft-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { canManageSettings, canSyncMasterConfig } from '../../src/presentation/utils/role-access';
import { canUseScenarioComparison } from '../../src/config/scenario-comparison-access';
import { valuationRepository } from '../../src/data/repositories';

function sessionSubtitle(user: AuthUser | null | undefined, isAdmin: boolean): string {
  if (!user) return isAdmin ? 'Perfil administrador' : 'Operador de campo';
  if (user.authSource === 'local_provisioned') {
    return isAdmin
      ? 'Administrador móvil · usuario registrado en la web'
      : 'Operador de campo · usuario registrado en la web';
  }
  if (user.authSource === 'local_seed' && isAdmin) {
    return 'Actualice los usuarios desde Configuración antes de operar en equipo';
  }
  return isAdmin ? 'Perfil administrador' : 'Operador de campo';
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const settings = useSettingsStore();
  const initDraft = useValuationDraftStore((s) => s.initDraft);
  const isAdmin = canManageSettings(user?.role);
  const canSync = canSyncMasterConfig(user?.role);
  const comparisonProductEnabled = canUseScenarioComparison();
  const showSeedBootstrapBanner =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    isAdmin &&
    user?.authSource === 'local_seed';
  const [outboxCount, setOutboxCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void valuationRepository.countOutbox().then((o) => setOutboxCount(o.pending + o.error));
    }, [])
  );

  const startNew = () => {
    initDraft(
      {
        factor: settings.factor,
        recPercentGold: settings.recPercentGold,
        recPercentSilver: settings.recPercentSilver,
        rcGold: settings.rcGold,
        rcSilver: settings.rcSilver,
        consumos: settings.consumos,
        flete: settings.flete,
        interGold: settings.interGold,
        interSilver: settings.interSilver,
      },
      { comparisonEnabled: false }
    );
    router.push('/(app)/valorizacion/nueva');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <ScreenHeader
          title={`Hola, ${user?.displayName ?? 'Usuario'}`}
          subtitle={sessionSubtitle(user, isAdmin)}
        />
        {showSeedBootstrapBanner ? (
          <View style={styles.banner}>
            <Text variant="bodySmall" style={styles.bannerText}>
              Cree su usuario móvil en la web (Usuarios de campo), luego use Configuración → Actualizar
              usuarios de campo en este teléfono. Después cierre sesión e ingrese con su usuario de campo.
            </Text>
          </View>
        ) : null}
        {outboxCount > 0 ? (
          <View style={styles.outboxBanner}>
            <Text variant="bodySmall" style={styles.outboxBannerText}>
              {outboxCount} cotización(es) de este teléfono pendientes de envío al panel. Revise Historial o
              Sincronizar configuración.
            </Text>
          </View>
        ) : null}
        <Button mode="contained" onPress={startNew} style={styles.btn} contentStyle={styles.btnContent}>
          Nueva valorización
        </Button>
        {comparisonProductEnabled ? (
          <Button
            mode="outlined"
            onPress={() => {
              initDraft(
                {
                  factor: settings.factor,
                  recPercentGold: settings.recPercentGold,
                  recPercentSilver: settings.recPercentSilver,
                  rcGold: settings.rcGold,
                  rcSilver: settings.rcSilver,
                  consumos: settings.consumos,
                  flete: settings.flete,
                  interGold: settings.interGold,
                  interSilver: settings.interSilver,
                },
                { comparisonEnabled: true }
              );
              router.push('/(app)/valorizacion/nueva');
            }}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Cotización con comparación de escenarios
          </Button>
        ) : null}
        <Button mode="outlined" onPress={() => router.push('/(app)/historial')} style={styles.btn} contentStyle={styles.btnContent}>
          Historial de cotizaciones
        </Button>
        {isAdmin ? (
          <Button mode="outlined" onPress={() => router.push('/(app)/configuracion')} style={styles.btn} contentStyle={styles.btnContent}>
            Configuración
          </Button>
        ) : null}
        {canSync ? (
          <Button
            mode="outlined"
            onPress={() => router.push('/(app)/sincronizar-configuracion')}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Sincronizar configuración
          </Button>
        ) : null}
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
  outboxBanner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  outboxBannerText: { lineHeight: 18, color: '#92400e' },
  btn: { marginBottom: 12 },
  btnContent: { paddingVertical: 10 },
});
