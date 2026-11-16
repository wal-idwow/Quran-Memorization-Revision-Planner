import React from 'react';
import {
  BellRing,
  BookOpenCheck,
  CalendarClock,
  Compass,
  Database,
  Download,
  LayoutDashboard,
  Moon,
  Repeat,
  Sun,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { ActiveView, Language, ThemeMode } from '../types/quran';
import { RubElHizbIcon } from './RubElHizbIcon';

interface SidebarProps {
  lang: Language;
  theme: ThemeMode;
  activeView: ActiveView;
  unreadCount: number;
  mobileOpen: boolean;
  isOnline: boolean;
  isOfflineReady: boolean;
  canInstall: boolean;
  onInstallApp: () => void;
  onOpenBackupModal: () => void;
  onCloseMobile: () => void;
  onSelectView: (view: ActiveView) => void;
  onToggleTheme: () => void;
  onToggleLang: () => void;
}

export function Sidebar({
  lang,
  theme,
  activeView,
  unreadCount,
  mobileOpen,
  isOnline,
  isOfflineReady,
  canInstall,
  onInstallApp,
  onOpenBackupModal,
  onCloseMobile,
  onSelectView,
  onToggleTheme,
  onToggleLang,
}: SidebarProps) {
  const t = TRANSLATIONS[lang];

  const navItems: Array<{ id: ActiveView; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'wird', label: t.nav.wird, icon: <BookOpenCheck className="w-4 h-4 shrink-0" /> },
    { id: 'plans', label: t.nav.plans, icon: <CalendarClock className="w-4 h-4 shrink-0" /> },
    { id: 'revision', label: t.nav.revision, icon: <Repeat className="w-4 h-4 shrink-0" /> },
    { id: 'map', label: t.nav.map, icon: <Compass className="w-4 h-4 shrink-0" /> },
    {
      id: 'reminders',
      label: t.nav.reminders,
      icon: <BellRing className="w-4 h-4 shrink-0" />,
      count: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const handleNav = (view: ActiveView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-3 text-start focus-visible:outline-none"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-700 text-white dark:bg-emerald-600 shrink-0">
            <RubElHizbIcon className="w-5 h-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {t.brandName}
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          aria-label={t.actions.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
              {item.count !== undefined && (
                <span className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom PWA Status, Backup, Theme & Language Controls */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 text-xs">
          <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{isOnline ? t.pwa.online : t.pwa.offline}</span>
          </span>
          {isOfflineReady && (
            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              {lang === 'ar' ? 'Offline ✓' : 'PWA ✓'}
            </span>
          )}
        </div>

        {canInstall && (
          <button
            type="button"
            onClick={() => {
              onInstallApp();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{t.pwa.installApp}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onOpenBackupModal();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
        >
          <span className="flex items-center gap-2.5">
            <Database className="w-4 h-4 shrink-0" />
            <span>{t.backup.menuLabel}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'light' ? (
              <Moon className="w-4 h-4 shrink-0" />
            ) : (
              <Sun className="w-4 h-4 shrink-0" />
            )}
            <span>{theme === 'light' ? t.theme.dark : t.theme.light}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
        >
          <span>{lang === 'ar' ? 'English Interface' : 'الواجهة العربية'}</span>
          <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'EN' : 'AR'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
