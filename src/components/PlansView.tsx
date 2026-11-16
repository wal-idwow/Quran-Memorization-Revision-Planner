import React, { useMemo, useState } from 'react';
import { Calendar, Check, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { JUZ_LIST, SURAHS } from '../data/quranData';
import { formatLocalizedDate, TRANSLATIONS } from '../i18n/translations';
import {
  DailyUnit,
  Language,
  MemorizationPlan,
  PlanDayTarget,
  PlanDirection,
  PlanScopeType,
} from '../types/quran';
import { getPlanStats, getTodayISO } from '../utils/plannerEngine';

interface PlansViewProps {
  lang: Language;
  plans: MemorizationPlan[];
  activePlan: MemorizationPlan | null;
  activeSchedule: PlanDayTarget[];
  onCreatePlan: (
    plan: Omit<MemorizationPlan, 'id' | 'createdAt' | 'completedDaysCount' | 'isActive'>
  ) => void;
  onActivatePlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onReschedulePlan: (planId: string) => void;
}

export function PlansView({
  lang,
  plans,
  activePlan,
  activeSchedule,
  onCreatePlan,
  onActivatePlan,
  onDeletePlan,
  onReschedulePlan,
}: PlansViewProps) {
  const t = TRANSLATIONS[lang];
  const [showBuilder, setShowBuilder] = useState(false);

  // Builder state
  const [name, setName] = useState('');
  const [scopeType, setScopeType] = useState<PlanScopeType>('juz_range');
  const [juzFrom, setJuzFrom] = useState(28);
  const [juzTo, setJuzTo] = useState(30);
  const [surahFrom, setSurahFrom] = useState(67);
  const [surahTo, setSurahTo] = useState(114);
  const [customSurahIds, setCustomSurahIds] = useState<number[]>([18, 36, 55, 67]);
  const [direction, setDirection] = useState<PlanDirection>('reverse');
  const [dailyAmount, setDailyAmount] = useState(1);
  const [dailyUnit, setDailyUnit] = useState<DailyUnit>('pages');
  const [activeDaysPerWeek, setActiveDaysPerWeek] = useState(6);
  const [revisionCycleDays, setRevisionCycleDays] = useState(7);
  const [startDate, setStartDate] = useState(getTodayISO());

  const draftStats = useMemo(
    () =>
      getPlanStats({
        scopeType,
        juzFrom,
        juzTo,
        surahFrom,
        surahTo,
        customSurahIds,
        direction,
        dailyAmount,
        dailyUnit,
        activeDaysPerWeek,
        startDate,
      }),
    [
      scopeType,
      juzFrom,
      juzTo,
      surahFrom,
      surahTo,
      customSurahIds,
      direction,
      dailyAmount,
      dailyUnit,
      activeDaysPerWeek,
      startDate,
    ]
  );

  const handleToggleCustomSurah = (id: number) => {
    setCustomSurahIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackName =
      lang === 'ar'
        ? `خطة حفظ مخصصة (${draftStats.totalPages} صفحة)`
        : `Custom Plan (${draftStats.totalPages} pages)`;

    onCreatePlan({
      name: name.trim() || fallbackName,
      scopeType,
      juzFrom,
      juzTo,
      surahFrom,
      surahTo,
      customSurahIds,
      direction,
      dailyAmount,
      dailyUnit,
      activeDaysPerWeek,
      revisionCycleDays,
      startDate,
    });
    setName('');
    setShowBuilder(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.plans.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.plans.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBuilder((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{showBuilder ? t.actions.cancel : t.actions.newPlan}</span>
        </button>
      </div>

      {/* Custom Plan Builder */}
      {showBuilder && (
        <form
          onSubmit={handleSavePlan}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.plans.planName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.plans.planNamePlaceholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.plans.startDate}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Scope Type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t.plans.scopeType}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'full_quran', label: t.plans.scopeFull },
                      { id: 'juz_range', label: t.plans.scopeJuz },
                      { id: 'surah_range', label: t.plans.scopeSurah },
                      { id: 'custom_surahs', label: t.plans.scopeCustom },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScopeType(item.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium text-start transition-colors ${
                        scopeType === item.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {scopeType === 'juz_range' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {t.plans.fromJuz}
                    </label>
                    <select
                      value={juzFrom}
                      onChange={(e) => setJuzFrom(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                    >
                      {JUZ_LIST.map((j) => (
                        <option key={j.id} value={j.id}>
                          {lang === 'ar' ? j.nameAr : j.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {t.plans.toJuz}
                    </label>
                    <select
                      value={juzTo}
                      onChange={(e) => setJuzTo(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                    >
                      {JUZ_LIST.map((j) => (
                        <option key={j.id} value={j.id}>
                          {lang === 'ar' ? j.nameAr : j.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {scopeType === 'surah_range' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {t.plans.fromSurah}
                    </label>
                    <select
                      value={surahFrom}
                      onChange={(e) => setSurahFrom(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}. {lang === 'ar' ? s.nameAr : s.transliteration}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {t.plans.toSurah}
                    </label>
                    <select
                      value={surahTo}
                      onChange={(e) => setSurahTo(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}. {lang === 'ar' ? s.nameAr : s.transliteration}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {scopeType === 'custom_surahs' && (
                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {SURAHS.map((s) => {
                    const checked = customSurahIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleCustomSurah(s.id)}
                        className={`px-2.5 py-1.5 rounded text-xs text-start truncate transition-colors ${
                          checked
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {s.id}. {lang === 'ar' ? s.nameAr : s.transliteration}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Daily Target & Weekly Rhythm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.plans.dailyTarget}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0.5}
                      step={dailyUnit === 'pages' ? 0.5 : 1}
                      max={60}
                      value={dailyAmount}
                      onChange={(e) => setDailyAmount(Math.max(0.5, Number(e.target.value)))}
                      className="w-20 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
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
                    {t.plans.activeDays}
                  </label>
                  <select
                    value={activeDaysPerWeek}
                    onChange={(e) => setActiveDaysPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  >
                    {[5, 6, 7].map((d) => (
                      <option key={d} value={d}>
                        {d} {t.plans.daysPerWeek}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.plans.direction}
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as PlanDirection)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="reverse">{t.plans.dirReverse}</option>
                    <option value="forward">{t.plans.dirForward}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.plans.revisionCycle}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[7, 14, 30].map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setRevisionCycleDays(cycle)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        revisionCycleDays === cycle
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.plans.everyDays.replace('{n}', String(cycle))}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Forecast Column */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{t.plans.livePreview}</span>
                </h3>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">{t.plans.totalSurahs}</dt>
                    <dd className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                      {draftStats.surahCount}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">{t.plans.totalPages}</dt>
                    <dd className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                      {draftStats.totalPages}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">{t.plans.totalAyahs}</dt>
                    <dd className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                      {draftStats.totalAyahs}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">{t.plans.studyDaysNeeded}</dt>
                    <dd className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                      {draftStats.activeStudyDays}
                    </dd>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <dt className="text-slate-700 dark:text-slate-300 font-medium">
                      {t.plans.estimatedEnd}
                    </dt>
                    <dd className="font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400">
                      {formatLocalizedDate(draftStats.estimatedEndDate, lang)}
                    </dd>
                  </div>
                </dl>
              </div>

              <button
                type="submit"
                disabled={draftStats.surahCount === 0}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium"
              >
                {t.actions.savePlan}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Saved Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const stats = getPlanStats(plan);
          const pct = Math.min(
            100,
            Math.round((plan.completedDaysCount / Math.max(1, stats.activeStudyDays)) * 100)
          );
          return (
            <div
              key={plan.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col justify-between ${
                plan.isActive
                  ? 'border-emerald-600 dark:border-emerald-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
                      {stats.totalPages} {t.map.pages} · {stats.totalAyahs} {t.map.ayahs} ·{' '}
                      {plan.dailyAmount}{' '}
                      {plan.dailyUnit === 'pages'
                        ? t.plans.unitPages
                        : plan.dailyUnit === 'lines'
                        ? t.plans.unitLines
                        : t.plans.unitAyahs}
                    </p>
                  </div>
                  {plan.isActive && (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                      {t.plans.activeBadge}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1 font-mono-tabular">
                    <span className="text-slate-500 dark:text-slate-400">
                      {plan.completedDaysCount}/{stats.activeStudyDays}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono-tabular">
                  {t.plans.estimatedEnd}: {formatLocalizedDate(stats.estimatedEndDate, lang)}
                </span>
                <div className="flex items-center gap-2">
                  {plan.isActive ? (
                    <button
                      type="button"
                      onClick={() => onReschedulePlan(plan.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.actions.recalculate}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onActivatePlan(plan.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.actions.activate}</span>
                      </button>
                      {plans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeletePlan(plan.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          aria-label={t.actions.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Plan Day-by-Day Schedule */}
      {activePlan && activeSchedule.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.plans.schedulePreviewTitle} — {activePlan.name}
            </h3>
            <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
              {activeSchedule.length} {t.revision.days}
            </span>
          </div>

          {/* Mobile Vertical Schedule */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {activeSchedule.slice(0, 45).map((row) => (
              <div
                key={`${row.dayIndex}-${row.surahId}-${row.ayahFrom}`}
                className={`p-4 space-y-1.5 ${
                  row.isCompleted ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                    #{row.dayIndex} · {formatLocalizedDate(row.date, lang)}
                  </span>
                  <span
                    className={`font-medium ${
                      row.isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {row.isCompleted ? t.plans.completed : t.plans.pending}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                    {lang === 'ar' ? `سورة ${row.surahNameAr}` : row.surahNameEn}
                  </span>
                  <span className="font-mono-tabular text-xs text-slate-600 dark:text-slate-300">
                    {t.wird.ayahRange} {row.ayahFrom}–{row.ayahTo} · {t.wird.pageRange}{' '}
                    {row.pageFrom}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Schedule Table */}
          <div className="hidden md:block overflow-x-auto max-h-96">
            <table className="w-full text-start border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-6 text-start">{t.plans.dayCol}</th>
                  <th className="py-3 px-4 text-start">{t.plans.dateCol}</th>
                  <th className="py-3 px-4 text-start">{t.plans.surahCol}</th>
                  <th className="py-3 px-4 text-end">{t.plans.portionCol}</th>
                  <th className="py-3 px-6 text-end">{t.plans.statusCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {activeSchedule.slice(0, 45).map((row) => (
                  <tr
                    key={`${row.dayIndex}-${row.surahId}-${row.ayahFrom}`}
                    className={
                      row.isCompleted
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }
                  >
                    <td className="py-2.5 px-6 font-mono-tabular text-slate-500 dark:text-slate-400">
                      #{row.dayIndex}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatLocalizedDate(row.date, lang)}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {lang === 'ar' ? `سورة ${row.surahNameAr}` : row.surahNameEn}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono-tabular text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {t.wird.ayahRange} {row.ayahFrom}–{row.ayahTo} · {t.wird.pageRange}{' '}
                      {row.pageFrom}
                    </td>
                    <td className="py-2.5 px-6 text-end text-xs font-medium whitespace-nowrap">
                      <span
                        className={
                          row.isCompleted
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {row.isCompleted ? t.plans.completed : t.plans.pending}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
