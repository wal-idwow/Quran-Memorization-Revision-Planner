import React from 'react';
import {
  BookOpenCheck,
  CalendarClock,
  Compass,
  LayoutDashboard,
  Repeat,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { ActiveView, Language } from '../types/quran';

interface BottomNavProps {
  lang: Language;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
}

export function BottomNav({ lang, activeView, onSelectView }: BottomNavProps) {
  const t = TRANSLATIONS[lang];

  const items: Array<{ id: ActiveView; label: string; icon: React.ReactNode }> = [
    {
      id: 'dashboard',
      label: lang === 'ar' ? 'الرئيسية' : 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'wird',
      label: lang === 'ar' ? 'الورد' : 'Wird',
      icon: <BookOpenCheck className="w-5 h-5" />,
    },
    {
      id: 'plans',
      label: lang === 'ar' ? 'الخطط' : 'Plans',
      icon: <CalendarClock className="w-5 h-5" />,
    },
    {
      id: 'revision',
      label: lang === 'ar' ? 'المراجعة' : 'Review',
      icon: <Repeat className="w-5 h-5" />,
    },
    {
      id: 'map',
      label: lang === 'ar' ? 'المصحف' : 'Map',
      icon: <Compass className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 safe-bottom"
      aria-label={t.nav.dashboard}
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
