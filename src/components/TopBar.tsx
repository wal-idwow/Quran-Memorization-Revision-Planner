import React, { useState } from 'react';
import { Bell, Check, Database, Download, Globe, Menu, Plus, Wifi, WifiOff } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { ActiveView, AppNotification, Language } from '../types/quran';

interface TopBarProps {
  lang: Language;
  activeView: ActiveView;
  notifications: AppNotification[];
  isOnline: boolean;
  canInstall: boolean;
  onInstallApp: () => void;
  onOpenBackupModal: () => void;
  onOpenMobileMenu: () => void;
  onToggleLang: () => void;
  onOpenLogModal: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigateReminders: () => void;
}

export function TopBar({
  lang,
  activeView,
  notifications,
  isOnline,
  canInstall,
  onInstallApp,
  onOpenBackupModal,
  onOpenMobileMenu,
  onToggleLang,
  onOpenLogModal,
  onMarkNotificationRead,
  onMarkAllRead,
  onNavigateReminders,
}: TopBarProps) {
  const t = TRANSLATIONS[lang];
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const viewTitleMap: Record<ActiveView, string> = {
    dashboard: t.nav.dashboard,
    wird: t.nav.wird,
    plans: t.nav.plans,
    revision: t.nav.revision,
    map: t.nav.map,
    reminders: t.nav.reminders,
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Start Zone: Mobile Menu + Contextual Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ms-1.5 sm:-ms-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {t.brandName}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <h1 className="font-display text-sm sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {viewTitleMap[activeView]}
          </h1>
        </div>
      </div>

      {/* End Zone: Offline Pill, Install, Backup, Language Toggle, Notification Bell, Primary CTA */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {!isOnline && (
          <span
            className="inline-flex items-center justify-center gap-1 px-2 md:px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 whitespace-nowrap"
            title={t.pwa.offline}
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{t.pwa.offline}</span>
          </span>
        )}
        {isOnline && (
          <span
            className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap"
            title={t.pwa.offlineReady}
          >
            <Wifi className="w-3.5 h-3.5 shrink-0" />
            <span>{t.pwa.online}</span>
          </span>
        )}

        {canInstall && (
          <button
            type="button"
            onClick={onInstallApp}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t.pwa.installApp}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenBackupModal}
          className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={t.backup.menuLabel}
          aria-label={t.backup.menuLabel}
        >
          <Database className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
        >
          <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'العربية'}</span>
        </button>

        {/* Smart Notification Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label={t.nav.reminders}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[11px] font-mono-tabular font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-96 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.reminders.inboxTitle}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {t.reminders.markAllRead}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-center text-slate-500 dark:text-slate-400">
                      {t.reminders.emptyInbox}
                    </p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex items-start justify-between gap-3 ${
                          !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {lang === 'ar' ? n.titleAr : n.titleEn}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {lang === 'ar' ? n.bodyAr : n.bodyEn}
                          </p>
                        </div>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => onMarkNotificationRead(n.id)}
                            className="p-1.5 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 shrink-0"
                            title={t.actions.markDone}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      onNavigateReminders();
                    }}
                    className="w-full text-center text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {t.nav.reminders}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">{lang === 'ar' ? 'تسجيل' : 'Log'}</span>
          <span className="hidden sm:inline">{t.actions.logSession}</span>
        </button>
      </div>
    </header>
  );
}
