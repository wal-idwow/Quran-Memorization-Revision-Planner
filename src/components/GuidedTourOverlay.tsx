import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Sparkles, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { Language } from '../types/quran';

interface GuidedTourOverlayProps {
  active: boolean;
  stepIndex: number;
  lang: Language;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onOpenWizard: () => void;
}

export function GuidedTourOverlay({
  active,
  stepIndex,
  lang,
  onNext,
  onPrev,
  onClose,
  onOpenWizard,
}: GuidedTourOverlayProps) {
  if (!active) return null;

  const t = TRANSLATIONS[lang];
  const stops = t.onboarding.tourStops;
  const total = stops.length;
  const safeIndex = Math.max(0, Math.min(total - 1, stepIndex));
  const current = stops[safeIndex];
  const isLast = safeIndex === total - 1;

  const NextArrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const PrevArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div
      role="region"
      aria-label={t.onboarding.badge}
      className="fixed bottom-20 inset-x-3 lg:bottom-6 lg:inset-x-auto lg:end-6 lg:w-[420px] z-40 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {current.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          aria-label={t.onboarding.tourSkip}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {current.desc}
      </p>

      {/* Progress Dots + Navigation */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {stops.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === safeIndex
                  ? 'w-5 bg-emerald-600 dark:bg-emerald-500'
                  : 'w-1.5 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {safeIndex === 3 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWizard();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إضافة محفوظ' : 'Seed Hifz'}</span>
            </button>
          )}

          {safeIndex > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <PrevArrow className="w-3.5 h-3.5" />
              <span>{t.onboarding.tourPrev}</span>
            </button>
          )}

          {!isLast ? (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium"
            >
              <span>{t.onboarding.tourNext}</span>
              <NextArrow className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.onboarding.tourDone}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
