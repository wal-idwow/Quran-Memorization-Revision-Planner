import React, { useMemo, useState } from 'react';
import { SURAH_MAP } from '../data/quranData';
import { formatLocalizedDate, TRANSLATIONS } from '../i18n/translations';
import { Language, QualityRating, SessionType, SurahProgress } from '../types/quran';
import { daysBetweenISO, getTodayISO } from '../utils/plannerEngine';

interface RevisionViewProps {
  lang: Language;
  progressMap: Record<number, SurahProgress>;
  memorizedPages: number;
  manzilCycleDays: number;
  onChangeManzilCycle: (days: number) => void;
  onQuickReview: (opts: {
    type: SessionType;
    surahId: number;
    ayahFrom: number;
    ayahTo: number;
    rating?: QualityRating;
  }) => void;
  onDirectRate: (surahId: number, rating: QualityRating) => void;
}

type RevisionFilter = 'due' | 'weak' | 'mastered' | 'all';

export function RevisionView({
  lang,
  progressMap,
  memorizedPages,
  manzilCycleDays,
  onChangeManzilCycle,
  onDirectRate,
}: RevisionViewProps) {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<RevisionFilter>('due');
  const today = getTodayISO();

  const memorizedItems = useMemo(() => {
    return Object.values(progressMap)
      .filter((p) => p.memorizedAyahs > 0)
      .sort((a, b) => a.retentionScore - b.retentionScore);
  }, [progressMap]);

  const filteredItems = useMemo(() => {
    return memorizedItems.filter((item) => {
      if (filter === 'due') {
        return !item.nextReviewAt || item.nextReviewAt <= today;
      }
      if (filter === 'weak') {
        return item.retentionScore < 75 || item.lastRating === 'needs_review';
      }
      if (filter === 'mastered') {
        return item.retentionScore >= 85;
      }
      return true;
    });
  }, [memorizedItems, filter, today]);

  const dailyManzilPages =
    memorizedPages > 0 ? Math.max(0.5, Number((memorizedPages / manzilCycleDays).toFixed(1))) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.revision.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.revision.subtitle}
        </p>
      </div>

      {/* Manzil Periodic Cycle Configurator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.revision.manzilTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.revision.manzilDesc}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.revision.cycleDays}:
            </span>
            {[7, 10, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onChangeManzilCycle(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  manzilCycleDays === days
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {days} {t.revision.days}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-start md:text-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            {t.revision.dailyManzilTarget}
          </span>
          <span className="text-2xl font-bold font-mono-tabular text-emerald-700 dark:text-emerald-400 mt-1 block">
            {dailyManzilPages} {t.dashboard.pagesLabel} / {t.plans.dayCol}
          </span>
          <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
            {memorizedPages} {t.map.pages} ÷ {manzilCycleDays} {t.revision.days}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-fit">
        {(
          [
            { id: 'due', label: t.revision.filterDue },
            { id: 'weak', label: t.revision.filterWeak },
            { id: 'mastered', label: t.revision.filterMastered },
            { id: 'all', label: t.revision.filterAll },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-center whitespace-nowrap ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Revision Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filteredItems.length === 0 ? (
          <p className="px-4 sm:px-6 py-10 text-sm text-center text-slate-500 dark:text-slate-400">
            {t.revision.emptyQueue}
          </p>
        ) : (
          <>
            {/* Mobile Vertical Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const surah = SURAH_MAP[item.surahId];
                if (!surah) return null;
                const diff = item.nextReviewAt ? daysBetweenISO(today, item.nextReviewAt) : 0;
                const dueLabel =
                  !item.nextReviewAt || diff === 0
                    ? t.revision.dueToday
                    : diff < 0
                    ? `${t.revision.overdue} (${Math.abs(diff)} ${t.revision.days})`
                    : formatLocalizedDate(item.nextReviewAt, lang);

                const retentionColor =
                  item.retentionScore >= 85
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                    : item.retentionScore >= 65
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50';

                return (
                  <div key={item.surahId} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {lang === 'ar' ? `سورة ${surah.nameAr}` : surah.transliteration}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                          {item.memorizedAyahs}/{surah.ayahCount} {t.map.ayahs} · {t.revision.interval}:{' '}
                          {item.intervalDays} {t.revision.days}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono-tabular text-xs font-semibold shrink-0 ${retentionColor}`}
                      >
                        {item.retentionScore}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-mono-tabular">
                        {t.revision.lastReviewed}:{' '}
                        {item.lastReviewedAt
                          ? formatLocalizedDate(item.lastReviewedAt, lang)
                          : t.revision.never}
                      </span>
                      <span
                        className={`font-mono-tabular ${
                          diff <= 0
                            ? 'text-amber-700 dark:text-amber-400 font-medium'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {dueLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onDirectRate(surah.id, 'mutqin')}
                        className="py-1.5 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium text-center hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                      >
                        {t.ratings.mutqin}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDirectRate(surah.id, 'good')}
                        className="py-1.5 px-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium text-center hover:bg-amber-100 dark:hover:bg-amber-900/60"
                      >
                        {t.ratings.good}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDirectRate(surah.id, 'needs_review')}
                        className="py-1.5 px-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-medium text-center hover:bg-rose-100 dark:hover:bg-rose-900/60 truncate"
                      >
                        {t.ratings.needs_review}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6 text-start">{t.plans.surahCol}</th>
                    <th className="py-3 px-4 text-end">{t.revision.retention}</th>
                    <th className="py-3 px-4 text-start">{t.revision.lastReviewed}</th>
                    <th className="py-3 px-4 text-start">{t.revision.nextReview}</th>
                    <th className="py-3 px-4 text-end">{t.revision.interval}</th>
                    <th className="py-3 px-6 text-end">{t.actions.reviewNow}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredItems.map((item) => {
                    const surah = SURAH_MAP[item.surahId];
                    if (!surah) return null;
                    const diff = item.nextReviewAt ? daysBetweenISO(today, item.nextReviewAt) : 0;
                    const dueLabel =
                      !item.nextReviewAt || diff === 0
                        ? t.revision.dueToday
                        : diff < 0
                        ? `${t.revision.overdue} (${Math.abs(diff)} ${t.revision.days})`
                        : formatLocalizedDate(item.nextReviewAt, lang);

                    const retentionColor =
                      item.retentionScore >= 85
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : item.retentionScore >= 65
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-rose-700 dark:text-rose-400';

                    return (
                      <tr
                        key={item.surahId}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {lang === 'ar' ? `سورة ${surah.nameAr}` : surah.transliteration}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mx-2 font-mono-tabular">
                            · {item.memorizedAyahs}/{surah.ayahCount} {t.map.ayahs}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-end font-mono-tabular font-semibold ${retentionColor}`}>
                          {item.retentionScore}%
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono-tabular text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {item.lastReviewedAt
                            ? formatLocalizedDate(item.lastReviewedAt, lang)
                            : t.revision.never}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-xs font-mono-tabular whitespace-nowrap ${
                            diff <= 0
                              ? 'text-amber-700 dark:text-amber-400 font-medium'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {dueLabel}
                        </td>
                        <td className="py-3.5 px-4 text-end font-mono-tabular text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {item.intervalDays} {t.revision.days}
                        </td>
                        <td className="py-3.5 px-6 text-end whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onDirectRate(surah.id, 'mutqin')}
                              className="px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                            >
                              {t.ratings.mutqin}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDirectRate(surah.id, 'good')}
                              className="px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/60"
                            >
                              {t.ratings.good}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDirectRate(surah.id, 'needs_review')}
                              className="px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/60"
                            >
                              {t.ratings.needs_review}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
