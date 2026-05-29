import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { valuationAppService } from '../../../src/data/repositories';
import { formatOwnershipUsername } from '../../../src/domain/constants/valuation-ownership';
import { VALUATION_PERMISSION_MESSAGES } from '../../../src/domain/valuation/valuation-permissions';
import { authUserToValuationActor } from '../../../src/presentation/utils/valuation-actor';
import { tryParseSnapshot } from '../../../src/data/repositories/valuation-repository';
import { snapshotToDraft } from '../../../src/data/mappers/snapshot-to-draft';
import { generateValuationCode } from '../../../src/domain/services/generate-valuation-code';
import { ValuationResultsCard } from '../../../src/presentation/components/valuation/ValuationResultsCard';
import { ScenarioComparisonCard } from '../../../src/presentation/components/valuation/ScenarioComparisonCard';
import { useValuationDraftStore } from '../../../src/presentation/store/valuation-draft-store';
import { useAuthStore } from '../../../src/presentation/store/auth-store';
import { screenPadding } from '../../../src/presentation/theme/app-theme';
import { formatDisplayDate, formatDisplayDateTime } from '../../../src/presentation/utils/format';
import type { Valuation } from '../../../src/domain/models/valuation';
import { useExportValuationPdf } from '../../../src/presentation/hooks/use-export-valuation-pdf';
import { ExportPdfScenarioPicker } from '../../../src/presentation/components/pdf/ExportPdfScenarioPicker';
import { buildExportOptionsFromSnapshot } from '../../../src/presentation/utils/export-scenario-options';
import {
  canDeleteValuation,
  canDuplicateValuation,
  canEditValuation,
} from '../../../src/presentation/utils/role-access';
import {
  canUseScenarioComparison,
  isScenarioComparisonUiVisible,
  primaryScenarioIndex,
} from '../../../src/config/scenario-comparison-access';

export default function HistorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const setDraftForEdit = useValuationDraftStore((s) => s.setDraftForEdit);
  const user = useAuthStore((s) => s.user);
  const { loading: pdfLoading, error: pdfError, exportFromSnapshot } = useExportValuationPdf();

  const load = useCallback(async () => {
    if (!id) return;
    const row = await valuationAppService.findById(id);
    setValuation(row);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!valuation) {
    return (
      <View style={styles.center}>
        <Text>Cargando…</Text>
      </View>
    );
  }

  const snapshot = tryParseSnapshot(valuation.snapshotJson);

  if (!snapshot) {
    return (
      <>
        <Stack.Screen options={{ title: valuation.code, headerShown: true }} />
        <View style={styles.center}>
          <Text variant="titleMedium" style={styles.errorTitle}>
            No se pudo abrir esta cotización
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            Los datos guardados están dañados o incompletos. Puede eliminar el registro o volver al listado.
          </Text>
          {user && canDeleteValuation(authUserToValuationActor(user), valuation) ? (
            <Button
              mode="outlined"
              textColor="#b00020"
              onPress={() => {
                Alert.alert(
                  'Eliminar cotización',
                  `¿Eliminar la cotización ${valuation.code}? Esta acción no se puede deshacer.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () => {
                        void (async () => {
                          await valuationAppService.delete(
                            authUserToValuationActor(user),
                            valuation.id
                          );
                          router.replace('/(app)/historial');
                        })();
                      },
                    },
                  ]
                );
              }}
              style={styles.btn}
            >
              Eliminar registro dañado
            </Button>
          ) : null}
          <Button mode="text" onPress={() => router.back()}>
            Volver al listado
          </Button>
        </View>
      </>
    );
  }

  const showComparison = isScenarioComparisonUiVisible({
    comparisonEnabled: snapshot.scenarios.length > 1,
    scenarios: snapshot.scenarios,
  });
  const activeIdx = snapshot.activeScenarioIndex ?? 0;
  const actor = user ? authUserToValuationActor(user) : null;
  const allowDuplicate = actor ? canDuplicateValuation(actor, valuation) : false;
  const allowDelete = actor ? canDeleteValuation(actor, valuation) : false;
  const allowEdit = actor ? canEditValuation(actor, valuation) : false;
  const scenario =
    snapshot.results.scenarios.find(
      (s) => s.label === snapshot.scenarios[activeIdx]?.label
    ) ?? snapshot.results.scenarios[0];

  const exportScenarioOptions = buildExportOptionsFromSnapshot(snapshot);

  const openForEdit = () => {
    if (!actor || !allowEdit) {
      Alert.alert('Sin permiso', VALUATION_PERMISSION_MESSAGES.editDenied);
      return;
    }
    const draft = snapshotToDraft(snapshot, {
      code: valuation.code,
      fecha: valuation.fecha,
      materialTypeCode: valuation.materialTypeCode,
      providerName: valuation.providerName ?? '',
      observaciones: valuation.observaciones ?? '',
    });
    setDraftForEdit(draft, snapshot.results, valuation.id);
    router.push('/(app)/valorizacion/nueva');
  };

  const duplicateValuation = async () => {
    if (!actor) return;
    const newCode = generateValuationCode();
    const newId = await valuationAppService.duplicate(actor, valuation.id, newCode);
    router.replace({ pathname: '/(app)/historial/[id]', params: { id: newId } });
  };

  const deleteValuation = async () => {
    if (!actor) return;
    await valuationAppService.delete(actor, valuation.id);
    router.replace('/(app)/historial');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar cotización',
      `¿Eliminar la cotización ${valuation.code}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void deleteValuation() },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: valuation.code, headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{valuation.code}</Text>
            <Text>Fecha de creación: {formatDisplayDate(valuation.createdAt.slice(0, 10))}</Text>
            <Text>Última modificación: {formatDisplayDate(valuation.fecha)}</Text>
            <Text>Creado por: {formatOwnershipUsername(valuation.createdByUsername)}</Text>
            <Text>Última edición por: {formatOwnershipUsername(valuation.updatedByUsername)}</Text>
            <Text>Tipo de material: {valuation.materialTypeCode}</Text>
            {valuation.providerName ? (
              <Text>Proveedor / cliente: {valuation.providerName}</Text>
            ) : null}
            <Text variant="bodySmall" style={styles.metaSecondary}>
              Registrado: {formatDisplayDateTime(snapshot.calculatedAt)}
            </Text>
          </Card.Content>
        </Card>

        {showComparison ? (
          <ScenarioComparisonCard
            result={snapshot.results}
            highlightLabel={snapshot.scenarios[activeIdx]?.label}
          />
        ) : null}
        <ValuationResultsCard result={snapshot.results} scenario={scenario} />

        <ExportPdfScenarioPicker
          scenarios={exportScenarioOptions}
          label="Exportar preliquidación en PDF"
          loading={pdfLoading}
          error={pdfError}
          onExport={(pickedIndex) => {
            const scenarioIndex = canUseScenarioComparison()
              ? pickedIndex
              : primaryScenarioIndex(activeIdx, snapshot.scenarios.length);
            void exportFromSnapshot(
              snapshot,
              {
                code: valuation.code,
                fecha: valuation.fecha,
                materialTypeCode: valuation.materialTypeCode,
                providerName: valuation.providerName,
                observaciones: valuation.observaciones,
                operatorName: formatOwnershipUsername(valuation.createdByUsername),
              },
              true,
              scenarioIndex
            );
          }}
        />
        {allowEdit ? (
          <Button mode="contained" onPress={openForEdit} style={styles.btn} contentStyle={styles.btnContent}>
            Abrir y editar
          </Button>
        ) : (
          <Text variant="bodySmall" style={styles.readOnlyHint}>
            Solo el creador o un administrador puede editar esta cotización.
          </Text>
        )}
        {allowDuplicate ? (
          <Button mode="outlined" onPress={duplicateValuation} style={styles.btn}>
            Duplicar cotización
          </Button>
        ) : null}
        {allowDelete ? (
          <Button mode="outlined" textColor="#b00020" onPress={confirmDelete} style={styles.btn}>
            Eliminar
          </Button>
        ) : null}
        <Button mode="text" onPress={() => router.back()}>
          Volver al listado
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: screenPadding, paddingBottom: 40 },
  card: { marginBottom: 12 },
  btn: { marginTop: 8 },
  btnContent: { paddingVertical: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  errorText: { textAlign: 'center', opacity: 0.75, marginBottom: 16 },
  metaSecondary: { marginTop: 8, opacity: 0.75 },
  readOnlyHint: { marginTop: 8, opacity: 0.75, textAlign: 'center' },
});
