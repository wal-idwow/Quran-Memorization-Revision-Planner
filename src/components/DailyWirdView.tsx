import React from 'react';
import { CheckCircle2, Circle, Plus } from 'lucide-react';
import { SURAH_MAP } from '../data/quranData';
import { formatLocalizedDate, TRANSLATIONS } from '../i18n/translations';
import {
  Language,
  PlanDayTarget,
  SessionType,
  StudySession,
  SurahProgress,
} from '../types/quran';

interface DailyWirdViewProps {
  lang: Language;
  nextPlanDayTarget: PlanDayTarget | null;
  dueSurahs: SurahProgress[];
  sessions: StudySession[];
  todayCompletedHifz: boolean;
  todayCompletedNearRevision: boolean;
  todayCompletedFarRevision: boolean;
  onQuickLog: (opts: {
    type: SessionType;
    surahId: number;
    ayahFrom: number;
    ayahTo: number;
  }) => void;
  onOpenCustomModal: () => void;
}

export function DailyWirdView({
  lang,
  nextPlanDayTarget,
  dueSurahs,
  sessions,
  todayCompletedHifz,
  todayCompletedNearRevision,
  todayCompletedFarRevision,
  onQuickLog,
  onOpenCustomModal,
}: DailyWirdViewProps) {
  const t = TRANSLATIONS[lang];

  const recentHifz = sessions.find((s) => s.type === 'new_hifz');
  const nearSurah = recentHifz ? SURAH_MAP[recentHifz.surahId] : SURAH_MAP[112];
  const farSurah = dueSurahs[0] ? SURAH_MAP[dueSurahs[0].surahId] : SURAH_MAP[67];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.wird.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.wird.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCustomModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actions.logSession}</span>
        </button>
      </div>

      {/* 3-Tier Daily Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1: New Hifz */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {t.wird.newTargetLabel}
              </span>
              {todayCompletedHifz ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            {nextPlanDayTarget ? (
              <>
                <h3 className="mt-3 font-quran text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'ar'
                    ? `سورة ${nextPlanDayTarget.surahNameAr}`
                    : nextPlanDayTarget.surahNameEn}
                </h3>
                <p className="mt-2 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {t.wird.ayahRange}: {nextPlanDayTarget.ayahFrom}–{nextPlanDayTarget.ayahTo} ·{' '}
                  {t.wird.pageRange}: {nextPlanDayTarget.pageFrom}–{nextPlanDayTarget.pageTo}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.noActivePlan}
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                className="w-full py-2 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {t.actions.completeTarget}
              </button>
            ) : (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 text-center">
                {todayCompletedHifz ? t.actions.completed : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Tier 2: Near Consolidation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t.wird.nearTargetLabel}
              </span>
              {todayCompletedNearRevision ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            {nearSurah && (
              <>
                <h3 className="mt-3 font-quran text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'ar' ? `سورة ${nearSurah.nameAr}` : nearSurah.transliteration}
                </h3>
                <p className="mt-2 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {t.wird.ayahRange}: 1–{nearSurah.ayahCount} · {t.wird.pageRange}:{' '}
                  {nearSurah.pageStart}–{nearSurah.pageEnd}
                </p>
              </>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {nearSurah && !todayCompletedNearRevision ? (
              <button
                type="button"
                onClick={() =>
                  onQuickLog({
                    type: 'near_revision',
                    surahId: nearSurah.id,
                    ayahFrom: 1,
                    ayahTo: nearSurah.ayahCount,
                  })
                }
                className="w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
              >
                {t.actions.completeTarget}
              </button>
            ) : (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 text-center">
                {t.actions.completed}
              </p>
            )}
          </div>
        </div>

        {/* Tier 3: Far Revision */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {t.wird.farTargetLabel}
              </span>
              {todayCompletedFarRevision ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            {farSurah && (
              <>
                <h3 className="mt-3 font-quran text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'ar' ? `سورة ${farSurah.nameAr}` : farSurah.transliteration}
                </h3>
                <p className="mt-2 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {t.wird.ayahRange}: 1–{farSurah.ayahCount} · {t.wird.pageRange}:{' '}
                  {farSurah.pageStart}–{farSurah.pageEnd}
                </p>
              </>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {farSurah && !todayCompletedFarRevision ? (
              <button
                type="button"
                onClick={() =>
                  onQuickLog({
                    type: 'far_revision',
                    surahId: farSurah.id,
                    ayahFrom: 1,
                    ayahTo: farSurah.ayahCount,
                  })
                }
                className="w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
              >
                {t.actions.reviewNow}
              </button>
            ) : (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 text-center">
                {t.actions.completed}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Session Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.wird.sessionHistory}
          </h3>
        </div>

        {sessions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center text-slate-500 dark:text-slate-400">
            {t.wird.emptyHistory}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-6 text-start">{t.plans.dateCol}</th>
                  <th className="py-3 px-4 text-start">{t.modal.sessionType}</th>
                  <th className="py-3 px-4 text-start">{t.plans.surahCol}</th>
                  <th className="py-3 px-4 text-end">{t.plans.portionCol}</th>
                  <th className="py-3 px-4 text-end">{t.modal.duration}</th>
                  <th className="py-3 px-6 text-end">{t.modal.ratingLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {sessions.slice(0, 15).map((s) => {
                  const surah = SURAH_MAP[s.surahId];
                  const typeLabel =
                    s.type === 'new_hifz'
                      ? t.modal.typeNewHifz
                      : s.type === 'near_revision'
                      ? t.modal.typeNearRevision
                      : t.modal.typeFarRevision;
                  const ratingCls =
                    s.rating === 'mutqin'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : s.rating === 'good'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-rose-700 dark:text-rose-400';

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-6 font-mono-tabular text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatLocalizedDate(s.date, lang)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {typeLabel}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {surah
                          ? lang === 'ar'
                            ? `سورة ${surah.nameAr}`
                            : surah.transliteration
                          : s.surahId}
                      </td>
                      <td className="py-3 px-4 text-end font-mono-tabular text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {s.ayahFrom}–{s.ayahTo} · {s.pagesCovered} {t.dashboard.pagesLabel}
                      </td>
                      <td className="py-3 px-4 text-end font-mono-tabular text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {s.durationMinutes} {t.wird.minutes}
                      </td>
                      <td className={`py-3 px-6 text-end font-medium whitespace-nowrap ${ratingCls}`}>
                        {t.ratings[s.rating]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
