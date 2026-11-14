import React, { useState } from 'react';
import { Bell, BellRing, CalendarPlus, Check, Volume2 } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { AppNotification, Language, ReminderSettings } from '../types/quran';
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../utils/notificationEngine';
import { generateReminderICS } from '../utils/plannerEngine';

interface RemindersViewProps {
  lang: Language;
  settings: ReminderSettings;
  notifications: AppNotification[];
  onUpdateSettings: (updater: (prev: ReminderSettings) => ReminderSettings) => void;
  onTriggerTest: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function RemindersView({
  lang,
  settings,
  notifications,
  onUpdateSettings,
  onTriggerTest,
  onMarkRead,
  onMarkAllRead,
}: RemindersViewProps) {
  const t = TRANSLATIONS[lang];
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    getBrowserNotificationPermission()
  );

  const handleRequestPermission = async () => {
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      onUpdateSettings((prev) => ({
        ...prev,
        browserNotificationsEnabled: true,
      }));
    }
  };

  const handleToggleRule = (ruleId: string) => {
    onUpdateSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    }));
  };

  const handleTimeChange = (ruleId: string, time: string) => {
    onUpdateSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, time } : r)),
    }));
  };

  const handleExportICS = () => {
    const primaryRule = settings.rules.find((r) => r.type === 'daily_hifz') ?? settings.rules[0];
    const time = primaryRule?.time ?? '05:30';
    const title =
      lang === 'ar'
        ? 'ورد حفظ ومراجعة القرآن الكريم — إتقان'
        : 'Daily Quran Memorization & Revision — Itqan';
    const desc =
      lang === 'ar'
        ? 'الورد اليومي: الحفظ الجديد + الربط القريب + المراجعة البعيدة'
        : 'Daily routine: New Hifz + Near Linking + Manzil Revision';

    const ics = generateReminderICS(time, title, desc);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itqan-daily-quran-wird.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const permMessage =
    permission === 'granted'
      ? t.reminders.permGranted
      : permission === 'denied'
      ? t.reminders.permDenied
      : permission === 'unsupported'
      ? t.reminders.permUnsupported
      : t.reminders.permDefault;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.reminders.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.reminders.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onTriggerTest}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-medium whitespace-nowrap"
        >
          <BellRing className="w-4 h-4" />
          <span>{t.actions.testNotification}</span>
        </button>
      </div>

      {/* Browser Permission & Sound/Quiet Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>{t.reminders.permissionCardTitle}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {permMessage}
              </p>
            </div>
            {permission !== 'granted' && permission !== 'unsupported' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-2 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40 whitespace-nowrap"
              >
                {t.actions.enableBrowserNotif}
              </button>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>{t.reminders.soundChime}</span>
              </span>
              <input
                type="checkbox"
                checked={settings.soundChimeEnabled}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    soundChimeEnabled: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-emerald-600"
              />
            </label>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  {t.reminders.quietHours}
                </span>
                <input
                  type="checkbox"
                  checked={settings.quietHoursEnabled}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      quietHoursEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>
              {settings.quietHoursEnabled && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{t.reminders.quietFrom}</span>
                  <input
                    type="time"
                    value={settings.quietStart}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({ ...prev, quietStart: e.target.value }))
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-tabular text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-slate-500 dark:text-slate-400">{t.reminders.quietTo}</span>
                  <input
                    type="time"
                    value={settings.quietEnd}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({ ...prev, quietEnd: e.target.value }))
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-tabular text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Native Calendar Sync */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.reminders.calendarSyncTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.reminders.calendarSyncDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportICS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>{t.actions.exportICS}</span>
            </button>
          </div>
        </div>

        {/* Smart Notification Log */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              {t.reminders.inboxTitle}
            </h3>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {t.reminders.markAllRead}
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-slate-500 dark:text-slate-400">
                {t.reminders.emptyInbox}
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-3.5 flex items-start justify-between gap-3 ${
                    !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div>
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
                      onClick={() => onMarkRead(n.id)}
                      className="p-1.5 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60"
                      title={t.actions.markDone}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Smart Triggers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.reminders.rulesTitle}
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {settings.rules.map((rule) => (
            <div
              key={rule.id}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                  className="mt-1 w-4 h-4 accent-emerald-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {lang === 'ar' ? rule.labelAr : rule.labelEn}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{t.reminders.presetsLabel}</span>
                    {[
                      { label: t.reminders.fajr, time: '05:30' },
                      { label: t.reminders.asr, time: '16:15' },
                      { label: t.reminders.maghrib, time: '18:30' },
                      { label: t.reminders.isha, time: '20:30' },
                    ].map((preset) => (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => handleTimeChange(rule.id, preset.time)}
                        className="hover:text-emerald-700 dark:hover:text-emerald-400 underline-offset-2 hover:underline"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <input
                  type="time"
                  value={rule.time}
                  onChange={(e) => handleTimeChange(rule.id, e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-tabular text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
