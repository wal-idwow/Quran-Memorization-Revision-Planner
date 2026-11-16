import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { JUZ_LIST, SURAHS } from '../data/quranData';
import { TRANSLATIONS } from '../i18n/translations';
import { Language, MasteryStatus, QualityRating, Surah, SurahProgress } from '../types/quran';
import { normalizeArabic } from '../utils/plannerEngine';

interface QuranMapViewProps {
  lang: Language;
  progressMap: Record<number, SurahProgress>;
  onUpdateSurah: (surahId: number, memorizedAyahs: number, rating: QualityRating) => void;
}

export function QuranMapView({ lang, progressMap, onUpdateSurah }: QuranMapViewProps) {
  const t = TRANSLATIONS[lang];
  const [mode, setMode] = useState<'surahs' | 'juz'>('surahs');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MasteryStatus>('all');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [draftAyahs, setDraftAyahs] = useState(0);
  const [draftRating, setDraftRating] = useState<QualityRating>('good');

  const filteredSurahs = useMemo(() => {
    const q = normalizeArabic(search);
    return SURAHS.filter((s) => {
      const progress = progressMap[s.id];
      const status: MasteryStatus = progress?.status ?? 'not_started';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!q) return true;
      return (
        normalizeArabic(s.nameAr).includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.transliteration.toLowerCase().includes(q) ||
        String(s.id) === q
      );
    });
  }, [search, statusFilter, progressMap]);

  const openInspector = (surah: Surah) => {
    const existing = progressMap[surah.id];
    setSelectedSurah(surah);
    setDraftAyahs(existing?.memorizedAyahs ?? surah.ayahCount);
    setDraftRating(existing?.lastRating ?? 'mutqin');
  };

  const handleSaveInspector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurah) return;
    onUpdateSurah(selectedSurah.id, draftAyahs, draftRating);
    setSelectedSurah(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.map.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.map.subtitle}
          </p>
        </div>

        {/* View Mode Switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('surahs')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'surahs'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.map.viewSurahs}
          </button>
          <button
            type="button"
            onClick={() => setMode('juz')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'juz'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.map.viewJuz}
          </button>
        </div>
      </div>

      {mode === 'surahs' ? (
        <>
          {/* Search & Status Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.map.searchPlaceholder}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="w-full sm:w-fit grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                [
                  { id: 'all', label: t.map.filterAll },
                  { id: 'mastered', label: t.map.filterMastered },
                  { id: 'reviewing', label: t.map.filterReviewing },
                  { id: 'learning', label: t.map.filterLearning },
                  { id: 'not_started', label: t.map.filterNotStarted },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium text-center transition-colors whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 114 Surahs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredSurahs.map((surah) => {
              const p = progressMap[surah.id];
              const mem = p?.memorizedAyahs ?? 0;
              const pct = Math.round((mem / surah.ayahCount) * 100);
              const status: MasteryStatus = p?.status ?? 'not_started';

              const statusTextCls =
                status === 'mastered'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : status === 'reviewing'
                  ? 'text-amber-700 dark:text-amber-400'
                  : status === 'learning'
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-slate-400 dark:text-slate-500';

              return (
                <button
                  key={surah.id}
                  type="button"
                  onClick={() => openInspector(surah)}
                  className="text-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/70 dark:hover:border-emerald-500/60 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono-tabular text-slate-400 dark:text-slate-500">
                        {String(surah.id).padStart(3, '0')} · {t.map.juz} {surah.juzStart}
                      </span>
                      <h3 className="font-quran text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {lang === 'ar' ? surah.nameAr : surah.transliteration}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {lang === 'ar' ? surah.transliteration : surah.nameEn}
                      </p>
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${statusTextCls}`}>
                      {t.statuses[status]}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400 mb-1">
                      <span>
                        {mem}/{surah.ayahCount} {t.map.ayahs}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status === 'mastered'
                            ? 'bg-emerald-600'
                            : status === 'reviewing'
                            ? 'bg-amber-500'
                            : 'bg-sky-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* 30 Juz Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {JUZ_LIST.map((juz) => {
            const juzSurahs = SURAHS.filter(
              (s) => s.juzEnd >= juz.id && s.juzStart <= juz.id
            );
            const totalAyahs = juzSurahs.reduce((sum, s) => sum + s.ayahCount, 0);
            const memAyahs = juzSurahs.reduce(
              (sum, s) => sum + Math.min(s.ayahCount, progressMap[s.id]?.memorizedAyahs ?? 0),
              0
            );
            const pct = totalAyahs > 0 ? Math.round((memAyahs / totalAyahs) * 100) : 0;

            return (
              <div
                key={juz.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                      {t.wird.pageRange} {juz.pageStart}–{juz.pageEnd}
                    </span>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mt-1">
                      {lang === 'ar' ? juz.nameAr : juz.nameEn}
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {pct}%
                  </span>
                </div>

                <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Surah Progress Update Modal */}
      {selectedSurah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {lang === 'ar'
                  ? `سورة ${selectedSurah.nameAr}`
                  : `${selectedSurah.transliteration} (${selectedSurah.nameEn})`}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSurah(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInspector} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                {selectedSurah.revelationType === 'meccan' ? t.map.meccan : t.map.medinan} ·{' '}
                {selectedSurah.ayahCount} {t.map.ayahs} · {t.wird.pageRange}{' '}
                {selectedSurah.pageStart}–{selectedSurah.pageEnd}
              </p>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <label>{t.map.memorizedAyahsLabel}</label>
                  <button
                    type="button"
                    onClick={() => setDraftAyahs(selectedSurah.ayahCount)}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {t.map.markFullSurah}
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={selectedSurah.ayahCount}
                  value={draftAyahs}
                  onChange={(e) => setDraftAyahs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.modal.ratingLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mutqin', 'good', 'needs_review'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDraftRating(r)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium ${
                        draftRating === r
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.ratings[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSurah(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium"
                >
                  {t.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
