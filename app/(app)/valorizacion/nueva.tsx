import { useEffect, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useValuationDraftStore } from '../../../src/presentation/store/valuation-draft-store';
import { useAuthStore } from '../../../src/presentation/store/auth-store';
import { draftRepository } from '../../../src/data/repositories';
import { useValuationForm } from '../../../src/presentation/hooks/use-valuation-form';
import { ValuationResultsPanel } from '../../../src/presentation/components/valuation/ValuationResultsPanel';
import { ScenarioComparisonCard } from '../../../src/presentation/components/valuation/ScenarioComparisonCard';
import { CotizadorHeaderBlock } from '../../../src/presentation/components/valuation/CotizadorHeaderBlock';
import { LotDataBlock } from '../../../src/presentation/components/valuation/LotDataBlock';
import { GradesRecoveryBlock } from '../../../src/presentation/components/valuation/GradesRecoveryBlock';
import { CommercialParamsBlock } from '../../../src/presentation/components/valuation/CommercialParamsBlock';
import { ScenarioTabs } from '../../../src/presentation/components/valuation/ScenarioTabs';
import { useSettingsStore } from '../../../src/presentation/store/settings-store';
import { useSyncStore } from '../../../src/presentation/store/sync-store';
import { buildInterMetalHint } from '../../../src/presentation/utils/inter-sync-hint';
import { buildCatalogValueHint } from '../../../src/presentation/utils/catalog-value-hint';
import { screenPadding } from '../../../src/presentation/theme/app-theme';
import { isScenarioComparisonUiVisible } from '../../../src/config/scenario-comparison-access';

export default function NewValuationScreen() {
  const draft = useValuationDraftStore((s) => s.draft);
  const editingValuationId = useValuationDraftStore((s) => s.editingValuationId);
  const settings = useSettingsStore();
  const lastSyncAt = useSyncStore((s) => s.metadata?.lastSyncAt ?? null);
  const isEditing = Boolean(editingValuationId);

  const interMeta = {
    interGoldSource: settings.interGoldSource,
    interSilverSource: settings.interSilverSource,
    interGoldFetchedAt: settings.interGoldFetchedAt,
    interSilverFetchedAt: settings.interSilverFetchedAt,
    interFetchStatus: settings.interFetchStatus,
    interFetchError: settings.interFetchError,
  };

  const {
    form,
    result,
    activeScenario,
    activeScenarioIndex,
    syncToStore,
    switchScenario,
    onMaquilaManualEdit,
    suggestedMaquila,
    suggestedRcGold,
    goldGradeOzTc,
  } = useValuationForm();

  const watched = form.watch();
  const scenario = watched.scenario;

  const interGoldHint =
    !isEditing && buildInterMetalHint('gold', settings.interGold, interMeta, lastSyncAt);
  const interSilverHint =
    !isEditing && buildInterMetalHint('silver', settings.interSilver, interMeta, lastSyncAt);

  const editHints = useMemo(() => {
    if (!isEditing) return null;
    return {
      factor: buildCatalogValueHint(watched.factor, settings.factor, { label: 'Factor comercial' }),
      recGold: buildCatalogValueHint(watched.recPercentGold, settings.recPercentGold, {
        label: 'REC oro',
      }),
      recSilver: buildCatalogValueHint(watched.recPercentSilver, settings.recPercentSilver, {
        label: 'REC plata',
      }),
      rcGold: buildCatalogValueHint(scenario?.rcGold, settings.rcGold, {
        label: 'RC oro',
        valuePrefix: 'US$',
      }),
      rcSilver: buildCatalogValueHint(scenario?.rcSilver, settings.rcSilver, {
        label: 'RC plata',
        valuePrefix: 'US$',
      }),
      interGold: buildCatalogValueHint(scenario?.interGold, settings.interGold, {
        label: 'INTER oro',
        valuePrefix: 'US$',
      }),
      interSilver: buildCatalogValueHint(scenario?.interSilver, settings.interSilver, {
        label: 'INTER plata',
        valuePrefix: 'US$',
      }),
      consumos: buildCatalogValueHint(scenario?.consumos, settings.consumos, {
        label: 'Consumos',
        valuePrefix: 'US$',
      }),
      flete: buildCatalogValueHint(scenario?.flete, settings.flete, {
        label: 'Flete',
        valuePrefix: 'US$',
      }),
    };
  }, [isEditing, watched, scenario, settings]);

  useFocusEffect(
    useCallback(() => {
      if (!useValuationDraftStore.getState().draft) {
        router.replace('/(app)/dashboard');
      }
    }, [])
  );

  useEffect(() => {
    return () => {
      const d = useValuationDraftStore.getState().draft;
      const uid = useAuthStore.getState().user?.id;
      if (d && uid) {
        void draftRepository.save(uid, d);
      }
    };
  }, []);

  if (!draft) return null;

  const { control, handleSubmit } = form;
  const showComparison = isScenarioComparisonUiVisible(draft);

  const onContinue = handleSubmit((values) => {
    syncToStore(values);
    router.push('/(app)/valorizacion/resultado');
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Cotización de lote', headerShown: true }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollBg}
      >
        <CotizadorHeaderBlock control={control} />

        {showComparison ? (
          <View style={styles.comparisonBlock}>
            <Text variant="labelLarge" style={styles.comparisonLabel}>
              Escenario activo
            </Text>
            <ScenarioTabs
              labels={draft.scenarios.map((s) => ({ label: s.label, name: s.name }))}
              activeIndex={activeScenarioIndex}
              onChange={switchScenario}
            />
            <Text variant="bodySmall" style={styles.scenarioName}>
              {draft.scenarios[activeScenarioIndex]?.name}
            </Text>
          </View>
        ) : null}

        <LotDataBlock control={control} factorCurrentHint={editHints?.factor ?? null} />
        <GradesRecoveryBlock
          control={control}
          recGoldCurrentHint={editHints?.recGold ?? null}
          recSilverCurrentHint={editHints?.recSilver ?? null}
        />
        <CommercialParamsBlock
          control={control}
          goldGradeOzTc={goldGradeOzTc}
          suggestedMaquila={suggestedMaquila}
          suggestedRcGold={suggestedRcGold}
          onMaquilaEdit={onMaquilaManualEdit}
          interGoldHint={interGoldHint}
          interSilverHint={interSilverHint}
          interGoldCurrentHint={editHints?.interGold ?? null}
          interSilverCurrentHint={editHints?.interSilver ?? null}
          rcGoldCurrentHint={editHints?.rcGold ?? null}
          rcSilverCurrentHint={editHints?.rcSilver ?? null}
          consumosCurrentHint={editHints?.consumos ?? null}
          fleteCurrentHint={editHints?.flete ?? null}
        />
        <ValuationResultsPanel result={result} scenario={activeScenario} />

        {showComparison ? (
          <ScenarioComparisonCard
            result={result}
            highlightLabel={draft.scenarios[activeScenarioIndex]?.label}
          />
        ) : null}

        <Button mode="contained" onPress={onContinue} style={styles.btn} contentStyle={styles.btnContent}>
          Ver resumen y exportar PDF
        </Button>
        <Button mode="outlined" onPress={() => router.back()} style={styles.btn}>
          Volver
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollBg: { backgroundColor: '#e8ecf0' },
  scroll: { padding: screenPadding, paddingBottom: 48 },
  comparisonBlock: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b8c4d0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  comparisonLabel: { fontWeight: '700', marginBottom: 4, color: '#1a3a5c' },
  scenarioName: { marginBottom: 4, opacity: 0.85 },
  btn: { marginTop: 8 },
  btnContent: { paddingVertical: 10 },
});
