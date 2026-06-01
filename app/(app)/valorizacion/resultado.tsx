import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { useValuationDraftStore } from '../../../src/presentation/store/valuation-draft-store';
import { ValuationResultsPanel } from '../../../src/presentation/components/valuation/ValuationResultsPanel';
import { ScenarioComparisonCard } from '../../../src/presentation/components/valuation/ScenarioComparisonCard';
import { CotizadorReadonlySummary } from '../../../src/presentation/components/valuation/CotizadorReadonlySummary';
import { formatMoney } from '../../../src/presentation/utils/format';
import { screenPadding } from '../../../src/presentation/theme/app-theme';
import { cotizadorStyles } from '../../../src/presentation/theme/cotizador-styles';
import { valuationAppService, configRepository } from '../../../src/data/repositories';
import { useAuthStore } from '../../../src/presentation/store/auth-store';
import { authUserToValuationActor } from '../../../src/presentation/utils/valuation-actor';
import { VALUATION_PERMISSION_MESSAGES } from '../../../src/domain/valuation/valuation-permissions';
import { FORMULA_VERSION } from '../../../src/domain/constants/formula';
import type { ValuationSnapshot } from '../../../src/domain/models/valuation';
import {
  draftToLotInput,
  scenarioDraftToParams,
} from '../../../src/presentation/forms/draft-mappers';
import { useExportValuationPdf } from '../../../src/presentation/hooks/use-export-valuation-pdf';
import { ExportPdfScenarioPicker } from '../../../src/presentation/components/pdf/ExportPdfScenarioPicker';
import { buildExportOptionsFromDraft } from '../../../src/presentation/utils/export-scenario-options';
import { todayIsoDate } from '../../../src/utils/date';
import {
  canUseScenarioComparison,
  isScenarioComparisonUiVisible,
  primaryScenarioIndex,
} from '../../../src/config/scenario-comparison-access';
import { scheduleValuationSync } from '../../../src/services/sync/sync-valuations.service';

export default function ResultadoScreen() {
  const draft = useValuationDraftStore((s) => s.draft);
  const lastResult = useValuationDraftStore((s) => s.lastResult);
  const editingValuationId = useValuationDraftStore((s) => s.editingValuationId);
  const clearDraft = useValuationDraftStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const { loading: pdfLoading, error: pdfError, exportFromDraft } = useExportValuationPdf();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!draft || !lastResult) {
    return (
      <View style={styles.empty}>
        <Text>Complete los datos de la cotización para ver el resumen.</Text>
        <Button onPress={() => router.back()}>Volver</Button>
      </View>
    );
  }

  const activeIdx = draft.activeScenarioIndex;
  const activeScenario =
    lastResult.scenarios.find((s) => s.label === draft.scenarios[activeIdx]?.label) ??
    lastResult.scenarios[0];
  const showComparison = isScenarioComparisonUiVisible(draft);
  const exportScenarioOptions = buildExportOptionsFromDraft(draft, lastResult);
  const isEditing = Boolean(editingValuationId);

  const saveToHistory = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const maquilaRanges = await configRepository.getMaquilaRanges();
      const snapshot: ValuationSnapshot = {
        formulaVersion: FORMULA_VERSION,
        lot: draftToLotInput(draft),
        scenarios: draft.scenarios.map((s) => scenarioDraftToParams(s, draft.factor)),
        maquilaRangesUsed: maquilaRanges.map((r) => ({
          minLeyOzTc: r.minLeyOzTc,
          maxLeyOzTc: r.maxLeyOzTc,
          maquila: r.maquila,
        })),
        appSettingsUsed: { factor: draft.factor },
        results: lastResult,
        calculatedAt: now,
        activeScenarioIndex: draft.activeScenarioIndex,
      };

      if (!user) {
        setSaveError(VALUATION_PERMISSION_MESSAGES.sessionRequired);
        return;
      }
      const actor = authUserToValuationActor(user);

      if (editingValuationId) {
        const fechaUltimaMod = todayIsoDate();
        await valuationAppService.update(actor, editingValuationId, {
          snapshot,
          updatedAt: now,
          code: draft.code,
          materialTypeCode: draft.materialTypeCode,
          providerId: null,
          providerName: draft.providerName || null,
          fecha: fechaUltimaMod,
          observaciones: draft.observaciones || null,
        });
        router.dismissTo({
          pathname: '/(app)/historial/[id]',
          params: { id: editingValuationId },
        });
      } else {
        const existing = await valuationAppService.findByCode(draft.code);
        if (existing) {
          setSaveError('Ya existe una cotización con ese código. Elija otro código.');
          return;
        }

        const newId = `val-${Crypto.randomUUID()}`;
        await valuationAppService.insert(actor, {
          id: newId,
          code: draft.code,
          materialTypeCode: draft.materialTypeCode,
          providerId: null,
          providerName: draft.providerName || null,
          fecha: draft.fecha,
          observaciones: draft.observaciones || null,
          formulaVersion: FORMULA_VERSION,
          snapshot,
          createdAt: now,
          updatedAt: now,
        });
        router.dismissTo('/(app)/historial');
        scheduleValuationSync();
      }

      clearDraft();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'No se pudo guardar la cotización');
    } finally {
      setSaving(false);
    }
  };

  const saveLabel = isEditing
    ? showComparison
      ? 'Actualizar cotización con comparación'
      : 'Actualizar cotización'
    : showComparison
      ? 'Guardar cotización con comparación'
      : 'Guardar cotización';

  return (
    <>
      <Stack.Screen
        options={{
          title: showComparison ? 'Comparación de cotizaciones' : 'Resumen de cotización',
          headerShown: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} style={styles.scrollBg}>
        <CotizadorReadonlySummary draft={draft} result={lastResult} />

        {showComparison ? (
          <ScenarioComparisonCard
            result={lastResult}
            highlightLabel={draft.scenarios[activeIdx]?.label}
          />
        ) : null}

        <ValuationResultsPanel result={lastResult} scenario={activeScenario} />

        {showComparison ? (
          <Text variant="bodySmall" style={styles.scenarioNote}>
            Escenario en edición: {draft.scenarios[activeIdx]?.label} —{' '}
            {draft.scenarios[activeIdx]?.name}
          </Text>
        ) : null}

        <View style={[cotizadorStyles.resultsHero, { marginBottom: 12 }]}>
          <Text style={cotizadorStyles.resultsHeroLabel}>
            {isEditing ? 'Total al actualizar' : 'Total a guardar'}
          </Text>
          <Text style={cotizadorStyles.resultsHeroValue}>
            {formatMoney(activeScenario.valorCompraTotal)}
          </Text>
        </View>

        <ExportPdfScenarioPicker
          scenarios={exportScenarioOptions}
          loading={pdfLoading}
          error={pdfError}
          onExport={(pickedIndex) => {
            const scenarioIndex = canUseScenarioComparison()
              ? pickedIndex
              : primaryScenarioIndex(draft.activeScenarioIndex, draft.scenarios.length);
            void exportFromDraft(
              draft,
              lastResult,
              user?.displayName ?? 'Operador',
              true,
              scenarioIndex
            );
          }}
        />
        <Button
          mode="contained"
          onPress={saveToHistory}
          loading={saving}
          disabled={saving}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          {saveLabel}
        </Button>
        {saveError ? (
          <HelperText type="error" visible>
            {saveError}
          </HelperText>
        ) : null}
        <Button mode="outlined" onPress={() => router.back()} style={styles.btn}>
          Volver a editar
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollBg: { backgroundColor: '#e8ecf0' },
  scroll: { padding: screenPadding, paddingBottom: 40 },
  scenarioNote: { marginVertical: 8, opacity: 0.85 },
  btn: { marginTop: 8 },
  btnContent: { paddingVertical: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
