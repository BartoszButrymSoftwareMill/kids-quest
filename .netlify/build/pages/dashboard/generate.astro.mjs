import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$DashboardLayout } from '../../chunks/DashboardLayout_DH7-M8AE.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect, useCallback, Component } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { g as generateQuestSchema } from '../../chunks/validation_TFVsMUGg.mjs';
export { renderers } from '../../renderers.mjs';

const PRESETS = [
  {
    id: "quick_5min",
    emoji: "⚡",
    title: "Szybka zabawa",
    description: "5 min, bez rekwizytów, średnia energia",
    params: {
      age_group_id: 2,
      // default 5-6
      duration_minutes: 5,
      location: "home",
      energy_level: "medium",
      prop_ids: [3]
      // bez rekwizytów
    }
  },
  {
    id: "creative_15min",
    emoji: "🎨",
    title: "Kreatywna chwila",
    description: "15 min, rysowanie, niska energia",
    params: {
      age_group_id: 2,
      duration_minutes: 15,
      location: "home",
      energy_level: "low",
      prop_ids: [2]
      // rysowanie
    }
  },
  {
    id: "building_30min",
    emoji: "🧱",
    title: "Budowanie",
    description: "30 min, klocki, średnia energia",
    params: {
      age_group_id: 2,
      duration_minutes: 30,
      location: "home",
      energy_level: "medium",
      prop_ids: [1]
      // klocki
    }
  },
  {
    id: "outdoor_20min",
    emoji: "🏃",
    title: "Ruch!",
    description: "20 min, dwór, wysoka energia",
    params: {
      age_group_id: 2,
      duration_minutes: 20,
      location: "outdoor",
      energy_level: "high",
      prop_ids: [3]
      // bez rekwizytów
    }
  }
];
const DEFAULT_FORM_VALUES = {
  age_group_id: void 0,
  duration_minutes: 30,
  location: void 0,
  energy_level: void 0,
  prop_ids: []
};
const STORAGE_KEYS = {
  GENERATOR_FORM: "kidsquest_generator_form",
  LAST_PARAMS: "kidsquest_last_params"
};
function isValidGeneratorFormData(data) {
  return data.age_group_id !== void 0 && data.duration_minutes !== void 0 && data.location !== void 0 && data.energy_level !== void 0;
}
function isRateLimitError(error) {
  return error.error === "rate_limit_exceeded";
}

function useGeneratorState(initialProfile, ageGroups, props) {
  const [state, setState] = useState(() => {
    let savedForm = null;
    if (typeof window !== "undefined") {
      savedForm = localStorage.getItem(STORAGE_KEYS.GENERATOR_FORM);
    }
    let formData = getInitialFormData(initialProfile);
    if (savedForm) {
      try {
        formData = JSON.parse(savedForm);
      } catch {
      }
    }
    return {
      currentState: "form",
      formData,
      generatedQuest: null,
      error: null,
      isGenerating: false,
      isSaving: false,
      ageGroups,
      props,
      profile: initialProfile
    };
  });
  useEffect(() => {
    if (typeof window !== "undefined" && state.formData) {
      localStorage.setItem(STORAGE_KEYS.GENERATOR_FORM, JSON.stringify(state.formData));
    }
  }, [state.formData]);
  const updateFormData = useCallback((data) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...data }
    }));
  }, []);
  const setLoading = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentState: "loading",
      isGenerating: true,
      error: null
    }));
  }, []);
  const setResult = useCallback((quest) => {
    setState((prev) => ({
      ...prev,
      currentState: "result",
      generatedQuest: quest,
      isGenerating: false,
      error: null
    }));
    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.LAST_PARAMS,
        JSON.stringify({
          age_group_id: quest.age_group_id,
          duration_minutes: quest.duration_minutes,
          location: quest.location,
          energy_level: quest.energy_level,
          prop_ids: quest.prop_ids
        })
      );
    }
  }, []);
  const setError = useCallback((error) => {
    setState((prev) => ({
      ...prev,
      currentState: "error",
      error,
      isGenerating: false,
      isSaving: false
    }));
  }, []);
  const resetToForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentState: "form",
      generatedQuest: null,
      error: null,
      isGenerating: false,
      isSaving: false
    }));
  }, []);
  const applyPreset = useCallback((preset) => {
    setState((prev) => ({
      ...prev,
      formData: {
        age_group_id: preset.params.age_group_id,
        duration_minutes: preset.params.duration_minutes,
        location: preset.params.location,
        energy_level: preset.params.energy_level,
        prop_ids: preset.params.prop_ids || []
      }
    }));
  }, []);
  const setSaving = useCallback((isSaving) => {
    setState((prev) => ({ ...prev, isSaving }));
  }, []);
  return {
    state,
    updateFormData,
    setLoading,
    setResult,
    setError,
    resetToForm,
    applyPreset,
    setSaving
  };
}
function getInitialFormData(profile) {
  if (profile) {
    return {
      age_group_id: profile.default_age_group_id,
      duration_minutes: profile.default_duration_minutes || 30,
      location: profile.default_location,
      energy_level: profile.default_energy_level,
      prop_ids: []
    };
  }
  return DEFAULT_FORM_VALUES;
}

function useQuestGeneration() {
  const generateQuest = useCallback(async (params) => {
    try {
      const response = await fetch("/api/quests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(3e4)
        // 30s timeout
      });
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      const quest = await response.json();
      return quest;
    } catch (err) {
      if (err instanceof TypeError) {
        throw {
          error: "network_error",
          message: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
        };
      }
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        throw {
          error: "timeout_error",
          message: "Generacja trwa zbyt długo. Spróbuj ponownie."
        };
      }
      throw err;
    }
  }, []);
  return { generateQuest };
}

function useQuestSave() {
  const saveQuest = useCallback(async (questData) => {
    try {
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      const quest = await response.json();
      return quest;
    } catch (err) {
      if (err instanceof TypeError) {
        throw {
          error: "network_error",
          message: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
        };
      }
      throw err;
    }
  }, []);
  return { saveQuest };
}

function PresetCard({ preset, onClick }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "\n        flex flex-col items-start gap-3 p-5 rounded-lg border-2 border-neutral-200 bg-white\n        hover:border-primary hover:bg-primary/5 hover:shadow-md\n        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2\n        transition-all duration-200 text-left w-full\n      ",
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-4xl", "aria-hidden": "true", children: preset.emoji }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-neutral-900 mb-1", children: preset.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-600", children: preset.description })
        ] })
      ]
    }
  );
}

function PresetSection({ onSelect, presets }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-neutral-900", children: "Szybki start" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: presets.map((preset) => /* @__PURE__ */ jsx(PresetCard, { preset, onClick: () => onSelect(preset) }, preset.id)) })
  ] });
}

function VisualPicker({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  tooltip,
  "data-testid": dataTestId
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", "data-testid": dataTestId, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-neutral-900", children: [
        label,
        required && /* @__PURE__ */ jsx("span", { className: "text-red-500 ml-1", children: "*" })
      ] }),
      tooltip && /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-500 cursor-help", title: tooltip, "aria-label": tooltip, children: "ℹ️" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: options.map((option) => {
      const isSelected = value === option.value;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => onChange(option.value),
          "data-value": option.value,
          "data-testid": dataTestId ? dataTestId === "location-picker" ? `location-${option.value}` : dataTestId === "energy-level-picker" ? `energy-${option.value}` : `${dataTestId}-${option.value}` : void 0,
          className: `
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                min-h-[80px] hover:border-primary/50 hover:bg-primary/5
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-neutral-200 bg-white"}
              `,
          "aria-pressed": isSelected,
          children: [
            option.emoji && /* @__PURE__ */ jsx("span", { className: "text-3xl mb-1", "aria-hidden": "true", children: option.emoji }),
            option.icon && /* @__PURE__ */ jsx("div", { className: "mb-1", children: option.icon }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-center text-neutral-900", children: option.label })
          ]
        },
        String(option.value)
      );
    }) }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 mt-1", children: error })
  ] });
}

const PRESET_VALUES = [5, 15, 30, 60];
function DurationSlider({
  value,
  onChange,
  error,
  required = false,
  "data-testid": dataTestId
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", "data-testid": dataTestId, children: [
    /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium text-neutral-900", children: [
      "Czas trwania",
      required && /* @__PURE__ */ jsx("span", { className: "text-red-500 ml-1", children: "*" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-primary", children: value }),
      /* @__PURE__ */ jsx("span", { className: "text-lg text-neutral-600 ml-2", children: "min" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-2", children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "range",
        min: "1",
        max: "480",
        value,
        onChange: (e) => onChange(Number(e.target.value)),
        className: "w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider-thumb",
        "aria-label": "Czas trwania w minutach",
        "data-testid": dataTestId ? `${dataTestId}-input` : void 0
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 justify-center flex-wrap", children: PRESET_VALUES.map((preset) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => onChange(preset),
        className: `
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${value === preset ? "bg-primary text-primary-foreground" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}
            `,
        children: [
          preset,
          " min"
        ]
      },
      preset
    )) }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 mt-1", children: error }),
    /* @__PURE__ */ jsx("style", { children: `
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      ` })
  ] });
}

function getEmojiForProp(code) {
  const emojiMap = {
    balls: "⚽",
    blocks: "🧱",
    books: "📚",
    building_sets: "🏗️",
    coloring: "🖍️",
    costumes: "🎭",
    crafts: "✂️",
    dolls_figures: "🪆",
    drawing: "🎨",
    music_instruments: "🎵",
    none: "🚫",
    paper_pencil: "📝",
    playdough: "🧈",
    plush_toys: "🧸",
    puppets: "🎪",
    puzzles: "🧩",
    sand_water: "🏖️",
    storytelling: "📖",
    toy_cars: "🚗"
  };
  return emojiMap[code] || "🎯";
}

function PropMultiSelect({ props, value, onChange, error }) {
  const handleToggle = (propId, checked) => {
    let newValues;
    if (propId === 3) {
      if (checked) {
        newValues = [3];
      } else {
        newValues = [];
      }
    } else {
      if (checked) {
        newValues = [...value.filter((id) => id !== 3), propId];
      } else {
        newValues = value.filter((id) => id !== propId);
      }
    }
    onChange(newValues);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-neutral-900", children: "Rekwizyty" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: props.map((prop) => {
      const isChecked = value.includes(prop.id);
      const emoji = getEmojiForProp(prop.code);
      return /* @__PURE__ */ jsxs(
        "label",
        {
          className: `
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all cursor-pointer
                min-h-[80px] hover:border-primary/50 hover:bg-primary/5
                ${isChecked ? "border-primary bg-primary/10 shadow-sm" : "border-neutral-200 bg-white"}
              `,
          children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: isChecked,
                onChange: (e) => handleToggle(prop.id, e.target.checked),
                className: "sr-only"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-3xl mb-1", "aria-hidden": "true", children: emoji }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-center text-neutral-900", children: prop.label }),
            isChecked && /* @__PURE__ */ jsx("div", { className: "absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-3 h-3 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }) }) })
          ]
        },
        prop.id
      );
    }) }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 mt-1", children: error })
  ] });
}

function GeneratorForm({ initialValues, ageGroups, props, onSubmit, isLoading }) {
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(generateQuestSchema),
    defaultValues: initialValues
  });
  const formValues = watch();
  const ageGroupOptions = ageGroups.map((group) => ({
    value: group.id,
    label: group.label,
    emoji: getEmojiForAgeGroup(group.code)
  }));
  const locationOptions = [
    { value: "home", label: "Dom", emoji: "🏠" },
    { value: "outdoor", label: "Dwór", emoji: "🌳" }
  ];
  const energyOptions = [
    { value: "low", label: "Niska", emoji: "😌" },
    { value: "medium", label: "Średnia", emoji: "😊" },
    { value: "high", label: "Wysoka", emoji: "🏃" }
  ];
  const handleFormSubmit = handleSubmit(
    (data) => {
      onSubmit(data);
    },
    (errors2) => {
      console.error("Form validation errors:", errors2);
    }
  );
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleFormSubmit, className: "space-y-8 max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx(
      VisualPicker,
      {
        label: "Wiek dziecka",
        options: ageGroupOptions,
        value: formValues.age_group_id ?? null,
        onChange: (value) => setValue("age_group_id", value),
        error: errors.age_group_id?.message,
        required: true,
        "data-testid": "age-group-selector"
      }
    ),
    /* @__PURE__ */ jsx(
      DurationSlider,
      {
        value: formValues.duration_minutes,
        onChange: (value) => setValue("duration_minutes", value),
        error: errors.duration_minutes?.message,
        required: true,
        "data-testid": "duration-slider"
      }
    ),
    /* @__PURE__ */ jsx(
      VisualPicker,
      {
        label: "Miejsce",
        options: locationOptions,
        value: formValues.location ?? null,
        onChange: (value) => setValue("location", value),
        error: errors.location?.message,
        required: true,
        "data-testid": "location-picker"
      }
    ),
    /* @__PURE__ */ jsx(
      VisualPicker,
      {
        label: "Poziom energii",
        options: energyOptions,
        value: formValues.energy_level ?? null,
        onChange: (value) => setValue("energy_level", value),
        error: errors.energy_level?.message,
        required: true,
        "data-testid": "energy-level-picker"
      }
    ),
    /* @__PURE__ */ jsx(
      PropMultiSelect,
      {
        props,
        value: formValues.prop_ids ?? [],
        onChange: (value) => setValue("prop_ids", value),
        error: errors.prop_ids?.message
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-4 border-t", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: isLoading,
          className: "flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          children: isLoading ? "Generuję..." : "Generuj quest"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/dashboard/create",
          className: "flex-1 px-6 py-3 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 transition-colors text-center",
          children: "Stwórz quest ręcznie"
        }
      )
    ] })
  ] });
}
function getEmojiForAgeGroup(code) {
  const emojiMap = {
    "3_4": "👶",
    "5_6": "🧒",
    "7_8": "👦",
    "9_10": "👧"
  };
  return emojiMap[code] || "👤";
}

function LoadingState({ message = "Generuję quest..." }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[400px] gap-4", "data-testid": "loading-state", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative w-16 h-16", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border-4 border-neutral-200 rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border-4 border-t-primary border-transparent rounded-full animate-spin" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-lg text-neutral-700 font-medium", children: message })
  ] });
}

function QuestContentDisplay({ quest, ageGroup, props }) {
  const selectedProps = props.filter((p) => quest.prop_ids.includes(p.id));
  const locationLabel = quest.location === "home" ? "Dom" : "Dwór";
  const energyLevelLabel = {
    low: "Niska",
    medium: "Średnia",
    high: "Wysoka"
  }[quest.energy_level];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-neutral-900", "data-testid": "quest-title", children: quest.title }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-primary/10 border-l-4 border-primary p-5 rounded-r-lg", "data-testid": "quest-hook", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-primary uppercase tracking-wide mb-2", children: "Hook" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-neutral-900 leading-relaxed", children: quest.hook })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-neutral-900", children: "Kroki" }),
      /* @__PURE__ */ jsx("ol", { className: "space-y-3", children: [quest.step1, quest.step2, quest.step3].map((step, index) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", "data-testid": `quest-step${index + 1}`, children: [
        /* @__PURE__ */ jsx("span", { className: "flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold", children: index + 1 }),
        /* @__PURE__ */ jsx("p", { className: "flex-1 text-neutral-700 leading-relaxed pt-1", children: step })
      ] }, index)) })
    ] }),
    (quest.easier_version || quest.harder_version) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      quest.easier_version && /* @__PURE__ */ jsxs("div", { className: "bg-green-50 border border-green-200 p-4 rounded-lg", "data-testid": "easier-version", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-green-900 mb-2", children: "🟢 Wersja łatwiej" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-green-800", children: quest.easier_version })
      ] }),
      quest.harder_version && /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 border border-orange-200 p-4 rounded-lg", "data-testid": "harder-version", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-orange-900 mb-2", children: "🔴 Wersja trudniej" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-orange-800", children: quest.harder_version })
      ] })
    ] }),
    quest.safety_notes && /* @__PURE__ */ jsx("div", { className: "bg-yellow-50 border border-yellow-200 p-4 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "text-2xl flex-shrink-0", "aria-hidden": "true", children: "⚠️" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-yellow-900 mb-1", children: "Bezpieczeństwo" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-yellow-800", children: quest.safety_notes })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-neutral-700 mb-3", children: "Parametry" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm", children: [
          "👶 ",
          ageGroup.label
        ] }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm",
            "data-testid": "quest-duration",
            children: [
              "⏱️ ",
              quest.duration_minutes,
              " min"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm",
            "data-testid": "quest-location",
            children: [
              "📍 ",
              locationLabel
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm",
            "data-testid": "quest-energy",
            children: [
              "⚡ ",
              energyLevelLabel
            ]
          }
        ),
        selectedProps.map((prop) => /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm",
            children: [
              getEmojiForProp(prop.code),
              " ",
              prop.label
            ]
          },
          prop.id
        ))
      ] })
    ] })
  ] });
}

function ResultActions({
  onAcceptAndStart,
  onSaveForLater,
  onSkip,
  onRegenerateWithSameParams,
  isSubmitting
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onAcceptAndStart,
          disabled: isSubmitting,
          className: "flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",
          children: [
            /* @__PURE__ */ jsx("span", { children: "✓" }),
            /* @__PURE__ */ jsx("span", { children: "Rozpocznij" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onSaveForLater,
          disabled: isSubmitting,
          className: "flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",
          children: [
            /* @__PURE__ */ jsx("span", { children: "💾" }),
            /* @__PURE__ */ jsx("span", { children: "Zapisz" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onSkip,
          disabled: isSubmitting,
          className: "flex-1 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",
          children: [
            /* @__PURE__ */ jsx("span", { children: "⏭️" }),
            /* @__PURE__ */ jsx("span", { children: "Pomiń" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onRegenerateWithSameParams,
          disabled: isSubmitting,
          className: "flex-1 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",
          children: [
            /* @__PURE__ */ jsx("span", { children: "🔄" }),
            /* @__PURE__ */ jsx("span", { children: "Wygeneruj ponownie" })
          ]
        }
      )
    ] })
  ] });
}

function QuestResult({
  quest,
  ageGroups,
  props,
  onAcceptAndStart,
  onSaveForLater,
  onSkip,
  onRegenerateWithSameParams,
  isSubmitting
}) {
  const ageGroup = ageGroups.find((ag) => ag.id === quest.age_group_id);
  if (!ageGroup) {
    return /* @__PURE__ */ jsx("div", { className: "text-center text-red-600", children: /* @__PURE__ */ jsx("p", { children: "Błąd: Nie znaleziono grupy wiekowej dla tego questa." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8 py-8", "data-testid": "quest-result", children: [
    /* @__PURE__ */ jsx(QuestContentDisplay, { quest, ageGroup, props }),
    /* @__PURE__ */ jsx(
      ResultActions,
      {
        onAcceptAndStart,
        onSaveForLater,
        onSkip,
        onRegenerateWithSameParams,
        isSubmitting
      }
    )
  ] });
}

function ErrorState({ error, onRetry, onBackToForm, canRetry }) {
  const [countdown, setCountdown] = useState(isRateLimitError(error) ? error.retry_after || 60 : null);
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev && prev > 0 ? prev - 1 : 0);
    }, 1e3);
    return () => clearInterval(timer);
  }, [countdown]);
  const canRetryNow = canRetry && (countdown === null || countdown <= 0);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center min-h-[400px] gap-6 max-w-md mx-auto px-4",
      "data-testid": "error-state",
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-full rounded-lg border border-red-200 bg-red-50 p-6", "data-testid": "error-message", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-6 w-6 text-red-600 flex-shrink-0 mt-0.5",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-red-900 mb-1", children: isRateLimitError(error) ? "Zbyt wiele prób" : "Błąd generacji" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: error.message }),
            countdown !== null && countdown > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-red-700 mt-2", children: [
              "Spróbuj za ",
              countdown,
              " sekund"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onRetry,
              disabled: !canRetryNow,
              className: "flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              children: canRetryNow ? "Spróbuj ponownie" : `Poczekaj (${countdown}s)`
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onBackToForm,
              className: "flex-1 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-neutral-200 transition-colors",
              children: "Powrót do formularza"
            }
          )
        ] })
      ]
    }
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[400px] gap-6 max-w-md mx-auto px-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-full rounded-lg border border-red-200 bg-red-50 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-6 w-6 text-red-600 flex-shrink-0 mt-0.5",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-red-900 mb-1", children: "Coś poszło nie tak" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-red-800", children: "Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę." }),
            this.state.error && /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
              /* @__PURE__ */ jsx("summary", { className: "text-xs text-red-700 cursor-pointer hover:underline", children: "Szczegóły błędu" }),
              /* @__PURE__ */ jsx("pre", { className: "mt-2 text-xs text-red-700 overflow-auto p-2 bg-red-100 rounded", children: this.state.error.message })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => window.location.reload(),
            className: "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors",
            children: "Odśwież stronę"
          }
        )
      ] });
    }
    return this.props.children;
  }
}

function GeneratorContainer({ profile, ageGroups, props }) {
  const { state, setLoading, setResult, setError, resetToForm, applyPreset, setSaving } = useGeneratorState(
    profile,
    ageGroups,
    props
  );
  const { generateQuest } = useQuestGeneration();
  const { saveQuest } = useQuestSave();
  const handlePresetSelect = useCallback(
    async (preset) => {
      applyPreset(preset);
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "preset_used",
            event_data: { preset_id: preset.id },
            app_version: "1.0.0"
          })
        });
      } catch {
      }
      setLoading();
      try {
        const quest = await generateQuest(preset.params);
        setResult(quest);
      } catch (err) {
        setError(err);
      }
    },
    [applyPreset, setLoading, generateQuest, setResult, setError]
  );
  const handleFormSubmit = useCallback(
    async (data) => {
      if (!isValidGeneratorFormData(data)) {
        setError({
          error: "validation_failed",
          message: "Wypełnij wszystkie wymagane pola"
        });
        return;
      }
      setLoading();
      try {
        const quest = await generateQuest(data);
        setResult(quest);
      } catch (err) {
        setError(err);
      }
    },
    [setLoading, generateQuest, setResult, setError]
  );
  const handleAcceptAndStart = useCallback(async () => {
    if (!state.generatedQuest) return;
    setSaving(true);
    const questToSave = {
      ...state.generatedQuest,
      status: "started",
      app_version: "1.0.0"
    };
    try {
      const savedQuest = await saveQuest(questToSave);
      window.location.href = `/dashboard/quest/${savedQuest.id}`;
    } catch {
      alert("Nie udało się zapisać questa. Spróbuj ponownie.");
      setSaving(false);
    }
  }, [state.generatedQuest, saveQuest, setSaving]);
  const handleSaveForLater = useCallback(async () => {
    if (!state.generatedQuest) return;
    setSaving(true);
    const questToSave = {
      ...state.generatedQuest,
      status: "saved",
      app_version: "1.0.0"
    };
    try {
      const savedQuest = await saveQuest(questToSave);
      window.location.href = `/dashboard/quest/${savedQuest.id}`;
    } catch {
      alert("Nie udało się zapisać questa. Spróbuj ponownie.");
      setSaving(false);
    }
  }, [state.generatedQuest, saveQuest, setSaving]);
  const handleSkip = useCallback(() => {
    resetToForm();
  }, [resetToForm]);
  const handleRegenerateWithSameParams = useCallback(async () => {
    if (!state.generatedQuest) return;
    const params = {
      age_group_id: state.generatedQuest.age_group_id,
      duration_minutes: state.generatedQuest.duration_minutes,
      location: state.generatedQuest.location,
      energy_level: state.generatedQuest.energy_level,
      prop_ids: state.generatedQuest.prop_ids
    };
    setLoading();
    try {
      const quest = await generateQuest(params);
      setResult(quest);
    } catch (err) {
      setError(err);
    }
  }, [state.generatedQuest, setLoading, generateQuest, setResult, setError]);
  const handleRetry = useCallback(() => {
    resetToForm();
  }, [resetToForm]);
  return /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    state.currentState === "form" && /* @__PURE__ */ jsxs("div", { className: "space-y-12", children: [
      /* @__PURE__ */ jsx(PresetSection, { onSelect: handlePresetSelect, presets: PRESETS }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", "aria-hidden": "true", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-neutral-300" }) }),
        /* @__PURE__ */ jsx("div", { className: "relative flex justify-center", children: /* @__PURE__ */ jsx("span", { className: "px-4 bg-white text-sm text-neutral-500", children: "lub dostosuj parametry" }) })
      ] }),
      /* @__PURE__ */ jsx(
        GeneratorForm,
        {
          initialValues: state.formData,
          ageGroups: state.ageGroups,
          props: state.props,
          onSubmit: handleFormSubmit,
          isLoading: state.isGenerating
        }
      )
    ] }),
    state.currentState === "loading" && /* @__PURE__ */ jsx(LoadingState, { message: "Generuję quest..." }),
    state.currentState === "result" && state.generatedQuest && /* @__PURE__ */ jsx(
      QuestResult,
      {
        quest: state.generatedQuest,
        ageGroups: state.ageGroups,
        props: state.props,
        onAcceptAndStart: handleAcceptAndStart,
        onSaveForLater: handleSaveForLater,
        onSkip: handleSkip,
        onRegenerateWithSameParams: handleRegenerateWithSameParams,
        isSubmitting: state.isSaving
      }
    ),
    state.currentState === "error" && state.error && /* @__PURE__ */ jsx(ErrorState, { error: state.error, onRetry: handleRetry, onBackToForm: resetToForm, canRetry: true })
  ] }) });
}

const $$Astro = createAstro();
const $$Generate = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Generate;
  let profile = null;
  try {
    const profileRes = await fetch(`${Astro2.url.origin}/api/profiles/me`, {
      headers: { Cookie: Astro2.request.headers.get("Cookie") || "" }
    });
    if (profileRes.ok) {
      profile = await profileRes.json();
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
  let ageGroups = [];
  try {
    const ageGroupsRes = await fetch(`${Astro2.url.origin}/api/age-groups`);
    if (ageGroupsRes.ok) {
      const data = await ageGroupsRes.json();
      ageGroups = data.age_groups;
    }
  } catch (error) {
    console.error("Error fetching age groups:", error);
    return new Response("Unable to load age groups", { status: 500 });
  }
  let props = [];
  try {
    const propsRes = await fetch(`${Astro2.url.origin}/api/props`);
    if (propsRes.ok) {
      const data = await propsRes.json();
      props = data.props;
    }
  } catch (error) {
    console.error("Error fetching props:", error);
    return new Response("Unable to load props", { status: 500 });
  }
  return renderTemplate`${renderComponent($$result, "DashboardLayout", $$DashboardLayout, { "title": "Generuj quest | KidsQuest", "description": "Wygeneruj spersonalizowan\u0105 zabaw\u0119 dla swojego dziecka przy pomocy AI" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container mx-auto px-4"> <div class="max-w-6xl mx-auto"> <div class="text-center mb-8"> <h1 class="text-4xl font-bold text-neutral-900 mb-2">Generuj quest</h1> <p class="text-lg text-neutral-600">Stwórz spersonalizowaną zabawę dla swojego dziecka w kilka sekund</p> </div> ${renderComponent($$result2, "GeneratorContainer", GeneratorContainer, { "profile": profile, "ageGroups": ageGroups, "props": props, "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/generator/GeneratorContainer", "client:component-export": "GeneratorContainer" })} </div> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/generate.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/generate.astro";
const $$url = "/dashboard/generate";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Generate,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
