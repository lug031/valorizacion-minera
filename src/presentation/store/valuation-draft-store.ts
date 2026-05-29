import { create } from 'zustand';

import { generateValuationCode } from '../../domain/services/generate-valuation-code';
import { todayIsoDate } from '../../utils/date';

import { COTIZADOR_DEFAULTS } from '../../domain/constants/cotizador-defaults';
import { canUseScenarioComparison } from '../../config/scenario-comparison-access';

import type { ValuationCalculationResult } from '../../domain/models/calculation';

import type { ScenarioLabel } from '../../domain/models/enums';

import {

  type ScenarioDraft,

  type ValuationDraft,

  normalizeValuationDraft,

} from '../../domain/models/draft';

import type { SettingsDefaults } from './settings-store';



export type { ScenarioDraft, ValuationDraft } from '../../domain/models/draft';

function buildScenario(

  label: ScenarioLabel,

  name: string,

  defaults: SettingsDefaults,

  overrides?: Partial<Pick<ScenarioDraft, 'maquila'>>

): ScenarioDraft {

  return {

    label,

    name,

    maquila: overrides?.maquila ?? COTIZADOR_DEFAULTS.maquilaGold,

    maquilaManuallyEdited: Boolean(overrides?.maquila),

    rcGold: defaults.rcGold,

    rcSilver: defaults.rcSilver,

    consumos: defaults.consumos,

    flete: defaults.flete,

    interGold: defaults.interGold,

    interSilver: defaults.interSilver,

    otrosCostos: '0',

  };

}



export function createEmptyDraft(

  defaults: SettingsDefaults,

  options?: { comparisonEnabled?: boolean }

): ValuationDraft {

  const comparisonEnabled =
    canUseScenarioComparison() && (options?.comparisonEnabled ?? false);

  const primary = buildScenario('A', 'Cotización', defaults, {

    maquila: COTIZADOR_DEFAULTS.maquilaGold,

  });



  const scenarios: ScenarioDraft[] = comparisonEnabled

    ? [

        primary,

        buildScenario('B', 'Competidor', defaults),

        buildScenario('C', 'Alternativa', defaults),

      ]

    : [primary];



  return {

    code: generateValuationCode(),

    fecha: todayIsoDate(),

    materialTypeCode: COTIZADOR_DEFAULTS.materialTypeCode,

    providerName: '',

    observaciones: '',

    factor: defaults.factor,

    tmh: COTIZADOR_DEFAULTS.tmh,

    h2oPercent: COTIZADOR_DEFAULTS.h2oPercent,

    goldGradeOzTc: COTIZADOR_DEFAULTS.goldGradeOzTc,

    silverGradeOzTc: COTIZADOR_DEFAULTS.silverGradeOzTc,

    recPercentGold: defaults.recPercentGold,

    recPercentSilver: defaults.recPercentSilver,

    comparisonEnabled,

    activeScenarioIndex: 0,

    scenarios,

  };

}



interface ValuationDraftState {

  draft: ValuationDraft | null;

  lastResult: ValuationCalculationResult | null;

  /** Si se abrió desde historial para editar, id del registro a actualizar al guardar. */
  editingValuationId: string | null;

  initDraft: (defaults: SettingsDefaults, options?: { comparisonEnabled?: boolean }) => void;

  setDraft: (draft: ValuationDraft, lastResult?: ValuationCalculationResult | null) => void;

  setDraftForEdit: (
    draft: ValuationDraft,
    lastResult: ValuationCalculationResult,
    valuationId: string
  ) => void;

  replaceDraft: (draft: ValuationDraft) => void;

  updateDraft: (partial: Partial<ValuationDraft>) => void;

  updateActiveScenario: (partial: Partial<ScenarioDraft>) => void;

  setActiveScenarioIndex: (index: number) => void;

  enableComparison: () => void;

  disableComparison: () => void;

  applySuggestedMaquila: (value: string, options?: { force?: boolean }) => void;
  applySuggestedRcGold: (value: string) => void;

  setLastResult: (result: ValuationCalculationResult | null) => void;

  clear: () => void;

}



export const useValuationDraftStore = create<ValuationDraftState>((set, get) => ({

  draft: null,

  lastResult: null,

  editingValuationId: null,



  initDraft: (defaults, options) =>

    set({
      draft: createEmptyDraft(defaults, options),
      lastResult: null,
      editingValuationId: null,
    }),



  setDraft: (draft, lastResult = null) =>

    set({
      draft: normalizeValuationDraft(draft),
      lastResult,
      editingValuationId: null,
    }),

  setDraftForEdit: (draft, lastResult, valuationId) =>
    set({
      draft: normalizeValuationDraft(draft),
      lastResult,
      editingValuationId: valuationId,
    }),



  replaceDraft: (draft) => set({ draft: normalizeValuationDraft(draft) }),



  updateDraft: (partial) => {

    const draft = get().draft;

    if (!draft) return;

    set({ draft: { ...draft, ...partial } });

  },



  updateActiveScenario: (partial) => {

    const draft = get().draft;

    if (!draft) return;

    const scenarios = [...draft.scenarios];

    const idx = draft.activeScenarioIndex;

    scenarios[idx] = { ...scenarios[idx], ...partial };

    set({ draft: { ...draft, scenarios } });

  },



  setActiveScenarioIndex: (index) => {

    const draft = get().draft;

    if (!draft || index < 0 || index >= draft.scenarios.length) return;

    set({ draft: { ...draft, activeScenarioIndex: index } });

  },



  enableComparison: () => {

    if (!canUseScenarioComparison()) return;

    const draft = get().draft;

    if (!draft || draft.comparisonEnabled) return;

    const base = draft.scenarios[0];

    const defaultsFromScenario: SettingsDefaults = {

      factor: draft.factor,

      recPercentGold: draft.recPercentGold,

      recPercentSilver: draft.recPercentSilver,

      rcGold: base.rcGold,

      rcSilver: base.rcSilver,

      consumos: base.consumos,

      flete: base.flete,

      interGold: base.interGold,

      interSilver: base.interSilver,

    };

    set({

      draft: {

        ...draft,

        comparisonEnabled: true,

        scenarios: [

          { ...base, label: 'A', name: base.name || 'Nuestra propuesta' },

          buildScenario('B', 'Competidor', defaultsFromScenario),

          buildScenario('C', 'Alternativa', defaultsFromScenario),

        ],

      },

    });

  },



  disableComparison: () => {

    if (!canUseScenarioComparison()) return;

    const draft = get().draft;

    if (!draft) return;

    const idx = Math.min(draft.activeScenarioIndex, draft.scenarios.length - 1);

    const active = draft.scenarios[idx];

    set({

      draft: {

        ...draft,

        comparisonEnabled: false,

        activeScenarioIndex: 0,

        scenarios: [

          {

            ...active,

            label: 'A',

            name: active.name || 'Cotización',

          },

        ],

      },

      lastResult: null,

    });

  },



  applySuggestedMaquila: (value, options) => {
    const draft = get().draft;
    if (!draft) return;
    const scenarios = [...draft.scenarios];
    const idx = draft.activeScenarioIndex;
    if (!options?.force && scenarios[idx].maquilaManuallyEdited) return;
    scenarios[idx] = {
      ...scenarios[idx],
      maquila: value,
      ...(options?.force ? { maquilaManuallyEdited: false } : {}),
    };
    set({ draft: { ...draft, scenarios } });
  },

  applySuggestedRcGold: (value) => {
    const draft = get().draft;
    if (!draft) return;
    const scenarios = [...draft.scenarios];
    const idx = draft.activeScenarioIndex;
    scenarios[idx] = { ...scenarios[idx], rcGold: value };
    set({ draft: { ...draft, scenarios } });
  },



  setLastResult: (result) => set({ lastResult: result }),



  clear: () => set({ draft: null, lastResult: null, editingValuationId: null }),

}));


