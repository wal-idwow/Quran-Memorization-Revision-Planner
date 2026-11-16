import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Compass,
  Globe,
  Layers,
  Moon,
  Search,
  Sparkles,
  Sun,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { JUZ_LIST, SURAHS, SURAH_MAP, TOTAL_QURAN_PAGES } from '../data/quranData';
import { formatLocalizedDate, TRANSLATIONS } from '../i18n/translations';
import {
  DailyUnit,
  Language,
  OnboardingSetupPayload,
  PlanDirection,
  QualityRating,
  SurahProgress,
  ThemeMode,
} from '../types/quran';
import { getPlanStats, getTodayISO, normalizeArabic } from '../utils/plannerEngine';
import { RubElHizbIcon } from './RubElHizbIcon';

interface OnboardingWizardModalProps {
  open: boolean;
  lang: Language;
  theme: ThemeMode;
  initialProgressMap: Record<number, SurahProgress>;
  initialManzilDays: number;
  isFirstTime: boolean;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onCompleteSetup: (payload: OnboardingSetupPayload, startTour: boolean) => void;
  onSkipToDemo: () => void;
  onClose: () => void;
}

function getSurahsForJuzId(juzId: number): number[] {
  return SURAHS.filter((s) => s.juzStart <= juzId && s.juzEnd >= juzId).map((s) => s.id);
}

export function OnboardingWizardModal({
  open,
  lang,
  theme,
  initialProgressMap,
  initialManzilDays,
  isFirstTime,
  onToggleLang,
  onToggleTheme,
  onCompleteSetup,
  onSkipToDemo,
  onClose,
}: OnboardingWizardModalProps) {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<1 | 2 | 3 | 4>(isFirstTime ? 1 : 2);

  // Step 2: Prior Hifz State (pre-filled only if non-first-time user already has memorized surahs)
  const [selectedSurahIds, setSelectedSurahIds] = useState<number[]>(() => {
    if (isFirstTime) return [];
    return Object.values(initialProgressMap)
      .filter((p) => {
        const s = SURAH_MAP[p.surahId];
        return s && p.memorizedAyahs >= s.ayahCount;
      })
      .map((p) => p.surahId);
  });
  const [selectorTab, setSelectorTab] = useState<'juz' | 'surahs'>('juz');
  const [surahSearch, setSurahSearch] = useState('');
  const [initialRating, setInitialRating] = useState<QualityRating>('good');

  // Step 3: Initial Plan & Manzil State
  const [createInitialPlan, setCreateInitialPlan] = useState(true);
  const [planName, setPlanName] = useState(
    lang === 'ar' ? 'خطة الحفظ والمراجعة اليومية' : 'My Daily Memorization Plan'
  );
  const [planPreset, setPlanPreset] = useState<'juz30_reverse' | 'full_forward' | 'custom_juz'>(
    'juz30_reverse'
  );
  const [juzFrom, setJuzFrom] = useState(29);
  const [juzTo, setJuzTo] = useState(30);
  const [direction, setDirection] = useState<PlanDirection>('reverse');
  const [dailyAmount, setDailyAmount] = useState(1);
  const [dailyUnit, setDailyUnit] = useState<DailyUnit>('pages');
  const [activeDaysPerWeek, setActiveDaysPerWeek] = useState(6);
  const [manzilCycleDays, setManzilCycleDays] = useState(initialManzilDays || 7);

  // Step 4: Reminders & Guided Tour
  const [morningReminderTime, setMorningReminderTime] = useState('05:30');
  const [eveningReminderTime, setEveningReminderTime] = useState('18:30');
  const [startTourAfter, setStartTourAfter] = useState(true);

  const selectedSet = useMemo(() => new Set(selectedSurahIds), [selectedSurahIds]);

  const selectionMetrics = useMemo(() => {
    const pageSet = new Set<number>();
    selectedSurahIds.forEach((id) => {
      const s = SURAH_MAP[id];
      if (!s) return;
      for (let p = s.pageStart; p <= s.pageEnd; p++) pageSet.add(p);
    });
    const pages = pageSet.size;
    const percent = Number(((pages / TOTAL_QURAN_PAGES) * 100).toFixed(1));
    return { count: selectedSurahIds.length, pages, percent };
  }, [selectedSurahIds]);

  const filteredSurahs = useMemo(() => {
    if (!surahSearch.trim()) return SURAHS;
    const q = normalizeArabic(surahSearch);
    return SURAHS.filter(
      (s) =>
        normalizeArabic(s.nameAr).includes(q) ||
        s.transliteration.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        String(s.id) === q
    );
  }, [surahSearch]);

  const resolvedPlanConfig = useMemo(() => {
    if (planPreset === 'juz30_reverse') {
      return {
        scopeType: 'juz_range' as const,
        juzFrom: 1,
        juzTo: 30,
        direction: 'reverse' as const,
      };
    }
    if (planPreset === 'full_forward') {
      return {
        scopeType: 'full_quran' as const,
        juzFrom: 1,
        juzTo: 30,
        direction: 'forward' as const,
      };
    }
    return {
      scopeType: 'juz_range' as const,
      juzFrom,
      juzTo,
      direction,
    };
  }, [planPreset, juzFrom, juzTo, direction]);

  const planPreviewStats = useMemo(() => {
    return getPlanStats({
      scopeType: resolvedPlanConfig.scopeType,
      juzFrom: resolvedPlanConfig.juzFrom,
      juzTo: resolvedPlanConfig.juzTo,
      direction: resolvedPlanConfig.direction,
      dailyAmount: Math.max(0.5, dailyAmount),
      dailyUnit,
      activeDaysPerWeek,
      startDate: getTodayISO(),
    });
  }, [resolvedPlanConfig, dailyAmount, dailyUnit, activeDaysPerWeek]);

  if (!open) return null;

  const toggleSurah = (surahId: number) => {
    setSelectedSurahIds((prev) =>
      prev.includes(surahId) ? prev.filter((id) => id !== surahId) : [...prev, surahId]
    );
  };

  const toggleJuz = (juzId: number) => {
    const juzSurahs = getSurahsForJuzId(juzId);
    const allSelected = juzSurahs.length > 0 && juzSurahs.every((id) => selectedSet.has(id));

    setSelectedSurahIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        juzSurahs.forEach((id) => next.delete(id));
      } else {
        juzSurahs.forEach((id) => next.add(id));
      }
      return Array.from(next);
    });
  };

  const applyPreset = (preset: 'zero' | 'amma' | 'amma_tabarak' | 'last3' | 'baqarah_amma') => {
    if (preset === 'zero') {
      setSelectedSurahIds([]);
      return;
    }
    if (preset === 'amma') {
      setSelectedSurahIds(SURAHS.filter((s) => s.id >= 78 && s.id <= 114).map((s) => s.id));
      return;
    }
    if (preset === 'amma_tabarak') {
      setSelectedSurahIds(SURAHS.filter((s) => s.id >= 67 && s.id <= 114).map((s) => s.id));
      return;
    }
    if (preset === 'last3') {
      setSelectedSurahIds(SURAHS.filter((s) => s.id >= 58 && s.id <= 114).map((s) => s.id));
      return;
    }
    if (preset === 'baqarah_amma') {
      const amma = SURAHS.filter((s) => s.id >= 78 && s.id <= 114).map((s) => s.id);
      setSelectedSurahIds([1, 2, ...amma]);
    }
  };

  const handleFinish = () => {
    onCompleteSetup(
      {
        memorizedSurahIds: selectedSurahIds,
        initialRating,
        createInitialPlan,
        planName,
        scopeType: resolvedPlanConfig.scopeType,
        juzFrom: resolvedPlanConfig.juzFrom,
        juzTo: resolvedPlanConfig.juzTo,
        direction: resolvedPlanConfig.direction,
        dailyAmount: Math.max(0.5, dailyAmount),
        dailyUnit,
        activeDaysPerWeek,
        manzilCycleDays,
        morningReminderTime,
        eveningReminderTime,
      },
      startTourAfter
    );
  };

  const NextArrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const PrevArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-wizard-title"
        className="w-full max-w-2xl max-h-[94dvh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-700 text-white dark:bg-emerald-600 shrink-0">
                <RubElHizbIcon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{t.onboarding.badge}</span>
                </span>
                <p id="onboarding-wizard-title" className="text-xs text-slate-500 dark:text-slate-400">
                  {t.onboarding.stepOf.replace('{curr}', String(step)).replace('{total}', '4')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onToggleLang}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'EN' : 'العربية'}</span>
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                aria-label={theme === 'light' ? t.theme.dark : t.theme.light}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              {!isFirstTime && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  aria-label={t.actions.close}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 4-Step Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 mt-3.5">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setStep(num as 1 | 2 | 3 | 4)}
                className={`h-1.5 rounded-full transition-colors ${
                  num <= step
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
                aria-label={lang === 'ar' ? `الخطوة ${num}` : `Step ${num}`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* STEP 1: Welcome, 3-Tier Philosophy & Offline-First */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.onboarding.step1Title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {t.onboarding.step1Subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/25 p-4 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.onboarding.tier1Title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.onboarding.tier1Desc}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/25 p-4 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.onboarding.tier2Title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.onboarding.tier2Desc}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/25 p-4 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.onboarding.tier3Title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.onboarding.tier3Desc}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 flex items-start gap-3">
                <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
                  <WifiOff className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.onboarding.offlineBoxTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {t.onboarding.offlineBoxDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Prior Hifz Seeding (Juz + Surahs Combined) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.onboarding.step2Title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {t.onboarding.step2Subtitle}
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  {t.onboarding.quickPresets}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'zero', label: t.onboarding.presetZero },
                      { id: 'amma', label: t.onboarding.presetAmma },
                      { id: 'amma_tabarak', label: t.onboarding.presetAmmaTabarak },
                      { id: 'last3', label: t.onboarding.presetLast3 },
                      { id: 'baqarah_amma', label: t.onboarding.presetBaqarahAmma },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Switcher: Juz (1-30) + Surahs (1-114) */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectorTab('juz')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectorTab === 'juz'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.onboarding.tabJuz}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorTab('surahs')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectorTab === 'surahs'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.onboarding.tabSurahs}
                </button>
              </div>

              {selectorTab === 'juz' ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-0.5">
                  {JUZ_LIST.map((juz) => {
                    const surahsInJuz = getSurahsForJuzId(juz.id);
                    const allSelected =
                      surahsInJuz.length > 0 && surahsInJuz.every((id) => selectedSet.has(id));
                    const someSelected =
                      !allSelected && surahsInJuz.some((id) => selectedSet.has(id));

                    return (
                      <button
                        key={juz.id}
                        type="button"
                        onClick={() => toggleJuz(juz.id)}
                        className={`p-2 rounded-lg border text-start transition-colors flex items-center justify-between gap-1 ${
                          allSelected
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            : someSelected
                            ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 text-slate-800 dark:text-slate-200'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-medium font-mono-tabular">
                          {lang === 'ar' ? `جزء ${juz.id}` : `Juz ${juz.id}`}
                        </span>
                        {allSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={surahSearch}
                      onChange={(e) => setSurahSearch(e.target.value)}
                      placeholder={t.onboarding.searchSurahPlaceholder}
                      className="w-full ps-9 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-0.5">
                    {filteredSurahs.map((surah) => {
                      const checked = selectedSet.has(surah.id);
                      return (
                        <button
                          key={surah.id}
                          type="button"
                          onClick={() => toggleSurah(surah.id)}
                          className={`px-2.5 py-2 rounded-lg border text-xs text-start flex items-center justify-between gap-1.5 transition-colors ${
                            checked
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-medium'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate">
                            {surah.id}. {lang === 'ar' ? surah.nameAr : surah.transliteration}
                          </span>
                          {checked && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Summary Strip */}
              <div className="px-3.5 py-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <span>
                  {t.onboarding.selectedCountLabel
                    .replace('{surahs}', String(selectionMetrics.count))
                    .replace('{pages}', String(selectionMetrics.pages))
                    .replace('{percent}', String(selectionMetrics.percent))}
                </span>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>

              {/* Initial Confidence Rating */}
              {selectionMetrics.count > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {t.onboarding.strengthLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: 'mutqin',
                          label: t.onboarding.strengthMutqin,
                          active:
                            'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
                        },
                        {
                          id: 'good',
                          label: t.onboarding.strengthGood,
                          active:
                            'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
                        },
                        {
                          id: 'needs_review',
                          label: t.onboarding.strengthWeak,
                          active:
                            'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInitialRating(opt.id)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium text-start transition-colors ${
                          initialRating === opt.id
                            ? opt.active
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: First Plan & Manzil Cycle */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.onboarding.step3Title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {t.onboarding.step3Subtitle}
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createInitialPlan}
                  onChange={(e) => setCreateInitialPlan(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t.onboarding.createPlanToggle}
                </span>
              </label>

              {createInitialPlan && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {t.onboarding.planNameLabel}
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {t.onboarding.directionLabel}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'juz30_reverse', label: t.onboarding.scopeJuz30Up },
                          { id: 'full_forward', label: t.onboarding.scopeFullForward },
                          { id: 'custom_juz', label: t.onboarding.scopeCustomJuz },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPlanPreset(opt.id)}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium text-start transition-colors ${
                            planPreset === opt.id
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {planPreset === 'custom_juz' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          {t.plans.fromJuz}
                        </label>
                        <select
                          value={juzFrom}
                          onChange={(e) => setJuzFrom(Number(e.target.value))}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                        >
                          {JUZ_LIST.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.id}. {lang === 'ar' ? j.nameAr : j.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          {t.plans.toJuz}
                        </label>
                        <select
                          value={juzTo}
                          onChange={(e) => setJuzTo(Number(e.target.value))}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                        >
                          {JUZ_LIST.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.id}. {lang === 'ar' ? j.nameAr : j.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          {t.plans.direction}
                        </label>
                        <select
                          value={direction}
                          onChange={(e) => setDirection(e.target.value as PlanDirection)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                        >
                          <option value="reverse">{t.plans.dirReverse}</option>
                          <option value="forward">{t.plans.dirForward}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        {t.onboarding.paceLabel}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0.5}
                          max={20}
                          step={0.5}
                          value={dailyAmount}
                          onChange={(e) => setDailyAmount(Number(e.target.value))}
                          className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                        />
                        <select
                          value={dailyUnit}
                          onChange={(e) => setDailyUnit(e.target.value as DailyUnit)}
                          className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                        >
                          <option value="pages">{t.plans.unitPages}</option>
                          <option value="lines">{t.plans.unitLines}</option>
                          <option value="ayahs">{t.plans.unitAyahs}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        {t.onboarding.daysPerWeekLabel}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 6, 7].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setActiveDaysPerWeek(d)}
                            className={`py-2 rounded-lg border text-xs font-mono-tabular font-medium ${
                              activeDaysPerWeek === d
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Forecast Card */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {t.onboarding.forecastCardTitle}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-mono-tabular">
                      {t.onboarding.forecastSummary
                        .replace('{pages}', String(planPreviewStats.totalPages))
                        .replace('{days}', String(planPreviewStats.activeStudyDays))
                        .replace(
                          '{date}',
                          formatLocalizedDate(planPreviewStats.estimatedEndDate, lang)
                        )}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.onboarding.manzilLabel}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 10, 14, 30].map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setManzilCycleDays(cycle)}
                      className={`py-2 rounded-lg border text-xs font-medium font-mono-tabular ${
                        manzilCycleDays === cycle
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.plans.everyDays.replace('{n}', String(cycle))}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Reminder Times & Tour Toggle */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.onboarding.step4Title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {t.onboarding.step4Subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <CalendarClock className="w-4 h-4 text-emerald-600" />
                    <span>{t.onboarding.morningTimeLabel}</span>
                  </div>
                  <input
                    type="time"
                    value={morningReminderTime}
                    onChange={(e) => setMorningReminderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {['05:15', '05:30', '07:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMorningReminderTime(preset)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono-tabular"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <CalendarClock className="w-4 h-4 text-amber-500" />
                    <span>{t.onboarding.eveningTimeLabel}</span>
                  </div>
                  <input
                    type="time"
                    value={eveningReminderTime}
                    onChange={(e) => setEveningReminderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {['16:30', '18:30', '20:30'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEveningReminderTime(preset)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono-tabular"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startTourAfter}
                  onChange={(e) => setStartTourAfter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
                />
                <span className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200">
                  {t.onboarding.startTourCheck}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          {isFirstTime ? (
            <button
              type="button"
              onClick={onSkipToDemo}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline underline-offset-2 text-center sm:text-start py-1"
            >
              {t.onboarding.skipToDemo}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-center sm:text-start py-1"
            >
              {t.actions.close}
            </button>
          )}

          <div className="flex items-center justify-end gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
              >
                <PrevArrow className="w-4 h-4" />
                <span>{t.onboarding.prevBtn}</span>
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors"
              >
                <span>{t.onboarding.nextBtn}</span>
                <NextArrow className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  {isFirstTime ? t.onboarding.finishBtn : t.onboarding.saveCloseBtn}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
