import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useSettingsStore } from '../../src/presentation/store/settings-store';
import { useValuationDraftStore } from '../../src/presentation/store/valuation-draft-store';
import { ScreenHeader } from '../../src/presentation/components/ui/ScreenHeader';
import { screenPadding } from '../../src/presentation/theme/app-theme';
import { canManageSettings, canSyncMasterConfig } from '../../src/presentation/utils/role-access';
import { canUseScenarioComparison } from '../../src/config/scenario-comparison-access';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const settings = useSettingsStore();
  const initDraft = useValuationDraftStore((s) => s.initDraft);
  const isAdmin = canManageSettings(user?.role);
  const canSync = canSyncMasterConfig(user?.role);
  const comparisonProductEnabled = canUseScenarioComparison();

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
          subtitle={isAdmin ? 'Perfil administrador' : 'Operador de campo'}
        />
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
  btn: { marginBottom: 12 },
  btnContent: { paddingVertical: 10 },
});
