import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  valuationFormSchema,
  type ValuationFormValues,
} from '../forms/valuation-form-schema';
import {
  draftToFormValues,
  formValuesToLotInput,
  buildAllScenarioParams,
  syncFormValuesToDraft,
  scenarioDraftToFormScenario,
} from '../forms/draft-mappers';
import { useValuationDraftStore } from '../store/valuation-draft-store';
import { useValuationCalculator } from './use-valuation-calculator';
import { isValuationFormReadyForCalculation } from '../utils/numeric-field';
import { tryToDecimal } from '../../utils/decimal';
import { suggestMaquila } from '../../domain/calculation/maquila-suggestion';
import { suggestRcGold } from '../../domain/calculation/rc-suggestion';
import { useConfigStore } from '../store/config-store';

export function useValuationForm() {
  const draft = useValuationDraftStore((s) => s.draft);
  const replaceDraft = useValuationDraftStore((s) => s.replaceDraft);
  const setActiveScenarioIndex = useValuationDraftStore((s) => s.setActiveScenarioIndex);
  const setLastResult = useValuationDraftStore((s) => s.setLastResult);
  const maquilaRanges = useConfigStore((s) => s.maquilaRanges);

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationFormSchema),
    mode: 'onChange',
    defaultValues: draft ? draftToFormValues(draft) : undefined,
  });

  useEffect(() => {
    if (draft) {
      form.reset(draftToFormValues(draft));
    }
  }, [draft?.code]);

  const watched = form.watch();
  const activeIndex = watched.activeScenarioIndex ?? 0;

  const formReady = isValuationFormReadyForCalculation(watched);

  const lot = useMemo(
    () =>
      formReady ? formValuesToLotInput(watched as ValuationFormValues) : null,
    [
      formReady,
      watched.tmh,
      watched.h2oPercent,
      watched.goldGradeOzTc,
      watched.silverGradeOzTc,
      watched.recPercentGold,
      watched.recPercentSilver,
      watched.factor,
      watched.scenario,
    ]
  );

  const scenarios = useMemo(() => {
    if (!draft || !formReady) return [];
    return buildAllScenarioParams(
      draft,
      watched.scenario,
      activeIndex,
      watched.factor ?? draft.factor
    );
  }, [draft, formReady, watched.scenario, activeIndex, watched.factor]);

  const { result, suggestedMaquila, suggestedRcGold } = useValuationCalculator({
    lot,
    scenarios,
  });

  /** Sugerencia visible aunque el formulario aún no esté completo (solo requiere ley oro). */
  const previewSuggestedMaquila = useMemo(() => {
    const ley = tryToDecimal(watched.goldGradeOzTc ?? '');
    if (!ley || maquilaRanges.length === 0) return null;
    return suggestMaquila(ley, maquilaRanges);
  }, [watched.goldGradeOzTc, maquilaRanges]);

  const previewSuggestedRcGold = useMemo(() => {
    const ley = tryToDecimal(watched.goldGradeOzTc ?? '');
    if (!ley) return null;
    return suggestRcGold(ley);
  }, [watched.goldGradeOzTc]);

  const displaySuggestedMaquila = suggestedMaquila ?? previewSuggestedMaquila;
  const displaySuggestedRcGold = suggestedRcGold ?? previewSuggestedRcGold;

  const activeScenarioResult = useMemo(() => {
    if (!result) return null;
    const label = draft?.scenarios[activeIndex]?.label;
    return result.scenarios.find((s) => s.label === label) ?? result.scenarios[activeIndex] ?? null;
  }, [result, draft, activeIndex]);

  useEffect(() => {
    setLastResult(result);
  }, [result, setLastResult]);

  const syncToStore = useCallback(
    (values: ValuationFormValues) => {
      if (!draft) return;
      replaceDraft(syncFormValuesToDraft(draft, values));
    },
    [draft, replaceDraft]
  );

  useEffect(() => {
    const sub = form.watch((values) => {
      syncToStore(values as ValuationFormValues);
    });
    return () => sub.unsubscribe();
  }, [form, syncToStore]);

  const switchScenario = useCallback(
    (newIndex: number) => {
      if (!draft) return;
      const values = form.getValues();
      const merged = syncFormValuesToDraft(draft, values);
      merged.activeScenarioIndex = newIndex;
      replaceDraft(merged);
      setActiveScenarioIndex(newIndex);
      form.setValue('activeScenarioIndex', newIndex);
      form.setValue('scenario', scenarioDraftToFormScenario(merged.scenarios[newIndex]));
    },
    [draft, form, replaceDraft, setActiveScenarioIndex]
  );

  const onMaquilaManualEdit = useCallback(() => {
    const values = form.getValues();
    syncToStore({ ...values, scenario: { ...values.scenario } });
    useValuationDraftStore.getState().updateActiveScenario({ maquilaManuallyEdited: true });
  }, [syncToStore, form]);

  return {
    form,
    result,
    suggestedMaquila: displaySuggestedMaquila,
    suggestedRcGold: displaySuggestedRcGold,
    goldGradeOzTc: watched.goldGradeOzTc ?? '',
    activeScenario: activeScenarioResult,
    activeScenarioIndex: activeIndex,
    syncToStore,
    switchScenario,
    onMaquilaManualEdit,
  };
}
