import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { Language } from '../types/quran';

interface DataBackupModalProps {
  open: boolean;
  lang: Language;
  isOnline: boolean;
  isOfflineReady: boolean;
  storagePersisted: boolean;
  canInstall: boolean;
  onInstallApp: () => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (rawJson: string) => { ok: boolean; error?: string };
  onStartFresh: () => void;
  onResetDemo: () => void;
}

export function DataBackupModal({
  open,
  lang,
  isOnline,
  isOfflineReady,
  storagePersisted,
  canInstall,
  onInstallApp,
  onClose,
  onExport,
  onImport,
  onStartFresh,
  onResetDemo,
}: DataBackupModalProps) {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmFresh, setConfirmFresh] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  useEffect(() => {
    if (open) {
      setFeedback(null);
      setConfirmFresh(false);
      setConfirmDemo(false);
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = onImport(content);
      if (result.ok) {
        setFeedback({ type: 'success', text: t.backup.importSuccess });
      } else {
        setFeedback({ type: 'error', text: t.backup.importError });
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', text: t.backup.importError });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartFreshClick = () => {
    if (!confirmFresh) {
      setConfirmFresh(true);
      setConfirmDemo(false);
      return;
    }
    onStartFresh();
    setConfirmFresh(false);
    onClose();
  };

  const handleResetDemoClick = () => {
    if (!confirmDemo) {
      setConfirmDemo(true);
      setConfirmFresh(false);
      return;
    }
    onResetDemo();
    setConfirmDemo(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2
              id="backup-modal-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {t.backup.modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t.actions.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Storage & Offline Readiness */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.backup.storageStatusTitle}
            </h3>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>{isOnline ? t.pwa.online : t.pwa.offline}</span>
                </span>
                {isOfflineReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.pwa.offlineReady}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t.backup.storageDualActive}</span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {storagePersisted
                    ? t.backup.storagePersistentGranted
                    : t.backup.storagePersistentPending}
                </span>
              </div>
            </div>

            {canInstall && (
              <button
                type="button"
                onClick={onInstallApp}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>{t.pwa.installApp}</span>
              </button>
            )}
          </div>

          {/* Backup & Cross-Device Transfer */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.backup.transferTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.backup.transferDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{t.backup.exportBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium transition-colors"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>{t.backup.importBtn}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>

          {/* Clean Start & Reset */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.backup.resetSectionTitle}
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleStartFreshClick}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  confirmFresh
                    ? 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700'
                    : 'border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                }`}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>
                  {confirmFresh ? t.backup.startFreshConfirm : t.backup.startFreshBtn}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetDemoClick}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  confirmDemo
                    ? 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>
                  {confirmDemo ? t.backup.restoreDemoConfirm : t.backup.restoreDemoBtn}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
