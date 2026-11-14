import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Plus } from 'lucide-react';
import { SURAH_MAP, TOTAL_QURAN_PAGES } from '../data/quranData';
import { formatLocalizedDate, formatShortDay, TRANSLATIONS } from '../i18n/translations';
import {
  ActiveView,
  Language,
  MemorizationPlan,
  PlanDayTarget,
  SessionType,
  StudySession,
  SurahProgress,
} from '../types/quran';
import { addDaysISO, getPlanStats, getTodayISO } from '../utils/plannerEngine';

interface DashboardViewProps {
  lang: Language;
  activePlan: MemorizationPlan | null;
  nextPlanDayTarget: PlanDayTarget | null;
  memorizedSummary: {
    memorizedAyahs: number;
    memorizedPages: number;
    percentQuran: number;
    completedSurahs: number;
    masteredSurahs: number;
  };
  streak: { current: number; best: number };
  avgRetention: number;
  dueSurahs: SurahProgress[];
  sessions: StudySession[];
  todaySessions: StudySession[];
  todayCompletedHifz: boolean;
  todayCompletedNearRevision: boolean;
  todayCompletedFarRevision: boolean;
  onNavigate: (view: ActiveView) => void;
  onQuickLog: (opts: {
    type: SessionType;
    surahId: number;
    ayahFrom: number;
    ayahTo: number;
  }) => void;
}

export function DashboardView({
  lang,
  activePlan,
  nextPlanDayTarget,
  memorizedSummary,
  streak,
  avgRetention,
  dueSurahs,
  sessions,
  todaySessions,
  todayCompletedHifz,
  todayCompletedNearRevision,
  todayCompletedFarRevision,
  onNavigate,
  onQuickLog,
}: DashboardViewProps) {
  const t = TRANSLATIONS[lang];
  const todayISO = getTodayISO();
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  const tiersCompleted =
    (todayCompletedHifz ? 1 : 0) +
    (todayCompletedNearRevision ? 1 : 0) +
    (todayCompletedFarRevision ? 1 : 0);
  const wirdPercent = Math.round((tiersCompleted / 3) * 100);

  const planStats = useMemo(
    () => (activePlan ? getPlanStats(activePlan) : null),
    [activePlan]
  );

  // Build 14-day activity dataset
  const activityDays = useMemo(() => {
    const days: Array<{ date: string; hifzPages: number; revPages: number; total: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const date = addDaysISO(todayISO, -i);
      const daySess = sessions.filter((s) => s.date === date);
      const hifzPages = daySess
        .filter((s) => s.type === 'new_hifz')
        .reduce((sum, s) => sum + s.pagesCovered, 0);
      const revPages = daySess
        .filter((s) => s.type !== 'new_hifz')
        .reduce((sum, s) => sum + s.pagesCovered, 0);
      days.push({
        date,
        hifzPages: Number(hifzPages.toFixed(1)),
        revPages: Number(revPages.toFixed(1)),
        total: Number((hifzPages + revPages).toFixed(1)),
      });
    }
    return days;
  }, [sessions, todayISO]);

  const maxActivity = Math.max(2, ...activityDays.map((d) => d.total));

  const nextNearSurah = useMemo(() => {
    const recentHifz = sessions.find((s) => s.type === 'new_hifz');
    if (recentHifz) return recentHifz.surahId;
    return 112;
  }, [sessions]);

  const nextFarSurah = dueSurahs[0]?.surahId ?? 67;

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.kpi.memorizedTitle}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              {memorizedSummary.memorizedPages}
            </span>
            <span className="text-xs font-mono-tabular text-emerald-700 dark:text-emerald-400 font-semibold">
              {memorizedSummary.percentQuran}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(1.5, (memorizedSummary.memorizedPages / TOTAL_QURAN_PAGES) * 100))}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {t.kpi.pagesOf} · {memorizedSummary.memorizedAyahs} {t.kpi.ayahsUnit}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.kpi.streakTitle}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              {streak.current}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.kpi.daysUnit}
            </span>
          </div>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {t.kpi.bestStreak}: {streak.best} {t.revision.days}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.kpi.todayWirdTitle}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              {wirdPercent}%
            </span>
            <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
              {tiersCompleted}/3
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${wirdPercent}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {todaySessions.length} {t.kpi.sessionsToday}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.kpi.revisionHealthTitle}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
              {avgRetention}%
            </span>
            <span
              className={`text-xs font-medium ${
                dueSurahs.length > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {dueSurahs.length} {t.kpi.dueTodayLabel}
            </span>
          </div>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {memorizedSummary.completedSurahs} {t.dashboard.surahProgressSuffix}
          </p>
        </div>
      </section>

      {/* Main Split: Today's 3-Tier Wird + Active Plan Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Today's 3-Tier Wird */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.dashboard.todayTasksTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.dashboard.todayTasksDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('wird')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>{t.nav.wird}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Tier 1: New Hifz */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {todayCompletedHifz ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.dashboard.newHifzTier}
                  </p>
                  {nextPlanDayTarget ? (
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                      {lang === 'ar'
                        ? `سورة ${nextPlanDayTarget.surahNameAr}`
                        : nextPlanDayTarget.surahNameEn}
                      <span className="font-normal text-slate-500 dark:text-slate-400 mx-2">·</span>
                      <span className="font-mono-tabular font-normal text-xs text-slate-600 dark:text-slate-300">
                        {t.wird.ayahRange} {nextPlanDayTarget.ayahFrom}–{nextPlanDayTarget.ayahTo} ({t.wird.pageRange} {nextPlanDayTarget.pageFrom})
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                      {t.dashboard.noActivePlan}
                    </p>
                  )}
                </div>
              </div>
              {nextPlanDayTarget && !todayCompletedHifz ? (
                <button
                  type="button"
                  onClick={() =>
                    onQuickLog({
                      type: 'new_hifz',
                      surahId: nextPlanDayTarget.surahId,
                      ayahFrom: nextPlanDayTarget.ayahFrom,
                      ayahTo: nextPlanDayTarget.ayahTo,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium whitespace-nowrap shrink-0"
                >
                  {t.actions.completeTarget}
                </button>
              ) : (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  {todayCompletedHifz ? t.actions.completed : '—'}
                </span>
              )}
            </div>

            {/* Tier 2: Near Consolidation */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {todayCompletedNearRevision ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.dashboard.nearRevisionTier}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {lang === 'ar'
                      ? `سورة ${SURAH_MAP[nextNearSurah]?.nameAr ?? ''}`
                      : SURAH_MAP[nextNearSurah]?.transliteration ?? ''}
                    <span className="font-normal text-slate-500 dark:text-slate-400 mx-2">·</span>
                    <span className="font-mono-tabular font-normal text-xs text-slate-600 dark:text-slate-300">
                      1–{SURAH_MAP[nextNearSurah]?.ayahCount ?? 10} {t.map.ayahs}
                    </span>
                  </p>
                </div>
              </div>
              {!todayCompletedNearRevision ? (
                <button
                  type="button"
                  onClick={() =>
                    onQuickLog({
                      type: 'near_revision',
                      surahId: nextNearSurah,
                      ayahFrom: 1,
                      ayahTo: SURAH_MAP[nextNearSurah]?.ayahCount ?? 10,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap shrink-0"
                >
                  {t.actions.markDone}
                </button>
              ) : (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  {t.actions.completed}
                </span>
              )}
            </div>

            {/* Tier 3: Far Revision (Manzil) */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {todayCompletedFarRevision ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.dashboard.farRevisionTier}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {lang === 'ar'
                      ? `سورة ${SURAH_MAP[nextFarSurah]?.nameAr ?? ''}`
                      : SURAH_MAP[nextFarSurah]?.transliteration ?? ''}
                    <span className="font-normal text-slate-500 dark:text-slate-400 mx-2">·</span>
                    <span className="font-mono-tabular font-normal text-xs text-slate-600 dark:text-slate-300">
                      1–{SURAH_MAP[nextFarSurah]?.ayahCount ?? 30} {t.map.ayahs}
                    </span>
                  </p>
                </div>
              </div>
              {!todayCompletedFarRevision ? (
                <button
                  type="button"
                  onClick={() =>
                    onQuickLog({
                      type: 'far_revision',
                      surahId: nextFarSurah,
                      ayahFrom: 1,
                      ayahTo: SURAH_MAP[nextFarSurah]?.ayahCount ?? 30,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap shrink-0"
                >
                  {t.actions.reviewNow}
                </button>
              ) : (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  {t.actions.completed}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Plan Summary */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.activePlanTitle}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.actions.newPlan}</span>
            </button>
          </div>

          {activePlan && planStats ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {activePlan.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
                  {activePlan.dailyAmount}{' '}
                  {activePlan.dailyUnit === 'pages'
                    ? t.plans.unitPages
                    : activePlan.dailyUnit === 'lines'
                    ? t.plans.unitLines
                    : t.plans.unitAyahs}{' '}
                  · {activePlan.activeDaysPerWeek} {t.plans.daysPerWeek}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.dashboard.completionProgress}
                  </span>
                  <span className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                    {activePlan.completedDaysCount} / {planStats.activeStudyDays} (
                    {Math.min(
                      100,
                      Math.round((activePlan.completedDaysCount / planStats.activeStudyDays) * 100)
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (activePlan.completedDaysCount / planStats.activeStudyDays) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {t.plans.totalPages}
                  </span>
                  <span className="text-sm font-semibold font-mono-tabular text-slate-900 dark:text-slate-100 mt-0.5 block">
                    {planStats.totalPages} · {planStats.surahCount} {t.plans.totalSurahs}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {t.dashboard.projectedFinish}
                  </span>
                  <span className="text-sm font-semibold font-mono-tabular text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    {formatLocalizedDate(planStats.estimatedEndDate, lang)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t.dashboard.createFirstPlan}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium"
              >
                {t.actions.newPlan}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Split: 14-Day Pace Chart + Due Revisions Queue */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 14-Day Pace SVG Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.activityChartTitle}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 inline-block" />
                {t.dashboard.newHifzTier}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 dark:bg-amber-400 inline-block" />
                {t.nav.revision}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-14 gap-1.5 sm:gap-2 items-end h-44 pt-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            {activityDays.map((day) => {
              const hifzPct = Math.round((day.hifzPages / maxActivity) * 100);
              const revPct = Math.round((day.revPages / maxActivity) * 100);
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center justify-end h-full group"
                  title={`${formatLocalizedDate(day.date, lang)}: ${day.total} ${t.dashboard.pagesLabel}`}
                >
                  <div className="w-full max-w-[20px] flex flex-col justify-end h-full gap-0.5">
                    {day.revPages > 0 && (
                      <div
                        className="w-full rounded-t bg-amber-500 dark:bg-amber-400 transition-all"
                        style={{ height: `${Math.max(6, revPct)}%` }}
                      />
                    )}
                    {day.hifzPages > 0 && (
                      <div
                        className="w-full rounded-t bg-emerald-600 dark:bg-emerald-500 transition-all"
                        style={{ height: `${Math.max(6, hifzPct)}%` }}
                      />
                    )}
                    {day.total === 0 && (
                      <div className="w-full h-1 rounded bg-slate-100 dark:bg-slate-800" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono-tabular text-slate-400 dark:text-slate-500">
            <span>{formatShortDay(activityDays[0]?.date ?? todayISO, lang)}</span>
            <span>{formatShortDay(activityDays[7]?.date ?? todayISO, lang)}</span>
            <span>{formatShortDay(activityDays[13]?.date ?? todayISO, lang)}</span>
          </div>
        </div>

        {/* Upcoming Revisions */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.upcomingReviewsTitle}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('revision')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>{t.nav.revision}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {dueSurahs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-center text-slate-500 dark:text-slate-400">
              {t.dashboard.allCaughtUp}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {dueSurahs.slice(0, 5).map((item) => {
                const surah = SURAH_MAP[item.surahId];
                if (!surah) return null;
                return (
                  <div
                    key={item.surahId}
                    className="px-6 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {lang === 'ar' ? `سورة ${surah.nameAr}` : surah.transliteration}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                        {t.revision.retention}: {item.retentionScore}% · {surah.ayahCount} {t.map.ayahs}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onQuickLog({
                          type: 'far_revision',
                          surahId: surah.id,
                          ayahFrom: 1,
                          ayahTo: surah.ayahCount,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                    >
                      {t.actions.reviewNow}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
