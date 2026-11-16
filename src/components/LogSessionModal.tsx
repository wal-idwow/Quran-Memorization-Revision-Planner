import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SURAHS, SURAH_MAP } from '../data/quranData';
import { TRANSLATIONS } from '../i18n/translations';
import { Language, QualityRating, SessionType, StudySession } from '../types/quran';
import { getTodayISO } from '../utils/plannerEngine';

interface LogSessionModalProps {
  open: boolean;
  lang: Language;
  initialType?: SessionType;
  initialSurahId?: number;
  initialAyahFrom?: number;
  initialAyahTo?: number;
  onClose: () => void;
  onSubmit: (session: Omit<StudySession, 'id' | 'timestamp'>) => void;
}

export function LogSessionModal({
  open,
  lang,
  initialType = 'new_hifz',
  initialSurahId = 92,
  initialAyahFrom = 1,
  initialAyahTo,
  onClose,
  onSubmit,
}: LogSessionModalProps) {
  const t = TRANSLATIONS[lang];
  const [type, setType] = useState<SessionType>(initialType);
  const [surahId, setSurahId] = useState<number>(initialSurahId);
  const [ayahFrom, setAyahFrom] = useState<number>(initialAyahFrom);
  const [ayahTo, setAyahTo] = useState<number>(
    initialAyahTo ?? SURAH_MAP[initialSurahId]?.ayahCount ?? 10
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [rating, setRating] = useState<QualityRating>('mutqin');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open) {
      setType(initialType);
      setSurahId(initialSurahId);
      const surah = SURAH_MAP[initialSurahId];
      setAyahFrom(initialAyahFrom);
      setAyahTo(initialAyahTo ?? surah?.ayahCount ?? 10);
      setDurationMinutes(20);
      setRating('mutqin');
      setNotes('');
    }
  }, [open, initialType, initialSurahId, initialAyahFrom, initialAyahTo]);

  if (!open) return null;

  const selectedSurah = SURAH_MAP[surahId] ?? SURAHS[0];

  const handleSurahChange = (nextId: number) => {
    setSurahId(nextId);
    const s = SURAH_MAP[nextId];
    if (s) {
      setAyahFrom(1);
      setAyahTo(s.ayahCount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeFrom = Math.max(1, Math.min(selectedSurah.ayahCount, ayahFrom));
    const safeTo = Math.max(safeFrom, Math.min(selectedSurah.ayahCount, ayahTo));
    const surahPages = Math.max(1, selectedSurah.pageEnd - selectedSurah.pageStart + 1);
    const pagesCovered = Number(
      (((safeTo - safeFrom + 1) / selectedSurah.ayahCount) * surahPages).toFixed(1)
    );

    onSubmit({
      date: getTodayISO(),
      type,
      surahId,
      ayahFrom: safeFrom,
      ayahTo: safeTo,
      pagesCovered: Math.max(0.1, pagesCovered),
      durationMinutes: Math.max(1, durationMinutes),
      rating,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-session-title"
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="log-session-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {t.modal.logTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t.actions.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Session Type Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              {t.modal.sessionType}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(
                [
                  { id: 'new_hifz', label: t.modal.typeNewHifz },
                  { id: 'near_revision', label: t.modal.typeNearRevision },
                  { id: 'far_revision', label: t.modal.typeFarRevision },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={`px-2.5 py-2 rounded-md text-xs font-medium transition-colors truncate ${
                    type === item.id
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surah Selector */}
          <div>
            <label
              htmlFor="modal-surah-select"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.modal.surah}
            </label>
            <select
              id="modal-surah-select"
              value={surahId}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            >
              {SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {lang === 'ar' ? `سورة ${s.nameAr}` : `${s.transliteration} (${s.nameEn})`} — {s.ayahCount} {t.map.ayahs}
                </option>
              ))}
            </select>
          </div>

          {/* Ayah Range & Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {t.modal.ayahFrom}
              </label>
              <input
                type="number"
                min={1}
                max={selectedSurah.ayahCount}
                value={ayahFrom}
                onChange={(e) => setAyahFrom(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {t.modal.ayahTo}
              </label>
              <input
                type="number"
                min={ayahFrom}
                max={selectedSurah.ayahCount}
                value={ayahTo}
                onChange={(e) => setAyahTo(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {t.modal.duration}
              </label>
              <input
                type="number"
                min={1}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Quality Rating */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              {t.modal.ratingLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'mutqin', label: t.modal.ratingMutqin, activeCls: 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
                  { id: 'good', label: t.modal.ratingGood, activeCls: 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
                  { id: 'needs_review', label: t.modal.ratingNeedsReview, activeCls: 'border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRating(item.id)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-start transition-colors ${
                    rating === item.id
                      ? item.activeCls
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t.modal.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.modal.notesPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium"
            >
              {t.modal.submitLog}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
