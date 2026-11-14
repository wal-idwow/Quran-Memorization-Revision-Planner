import { Language, ReminderSettings, SurahProgress } from '../types/quran';
import { getTodayISO } from './plannerEngine';

export function playGentleChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 warm triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.7);
    });
  } catch {
    // Ignore audio context blocks when user hasn't interacted yet
  }
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function dispatchSystemNotification(title: string, body: string, playSound: boolean): boolean {
  if (playSound) {
    playGentleChime();
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        tag: 'itqan-quran-reminder',
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function isTimeInQuietHours(hhmm: string, start: string, end: string): boolean {
  if (start <= end) {
    return hhmm >= start && hhmm <= end;
  }
  // Wraps past midnight (e.g., 22:30 to 04:30)
  return hhmm >= start || hhmm <= end;
}

export function evaluateDueReminders(params: {
  settings: ReminderSettings;
  todayCompletedHifz: boolean;
  todayCompletedRevision: boolean;
  progressMap: Record<number, SurahProgress>;
  lang: Language;
}): Array<{ ruleId: string; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }> {
  const { settings, todayCompletedHifz, todayCompletedRevision, progressMap } = params;
  const now = new Date();
  const today = getTodayISO();
  const dayOfWeek = now.getDay();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (settings.quietHoursEnabled && isTimeInQuietHours(hhmm, settings.quietStart, settings.quietEnd)) {
    return [];
  }

  const overdueCount = Object.values(progressMap).filter(
    (p) => p.memorizedAyahs > 0 && p.nextReviewAt && p.nextReviewAt <= today
  ).length;

  const triggered: Array<{ ruleId: string; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }> = [];

  for (const rule of settings.rules) {
    if (!rule.enabled) continue;
    if (!rule.daysOfWeek.includes(dayOfWeek)) continue;
    if (settings.lastNotifiedMap[rule.id] === today) continue;
    if (hhmm < rule.time) continue;

    if (rule.type === 'daily_hifz' && !todayCompletedHifz) {
      triggered.push({
        ruleId: rule.id,
        titleAr: 'حان وقت ورد الحفظ اليومي',
        titleEn: 'Time for Today’s Quran Memorization',
        bodyAr: 'خصّص دقائق هادئة الآن لإتمام ورد الحفظ الجديد المجدول في خطتك.',
        bodyEn: 'Take a focused moment now to complete today’s scheduled memorization target.',
      });
    } else if (rule.type === 'evening_revision' && !todayCompletedRevision) {
      triggered.push({
        ruleId: rule.id,
        titleAr: 'تذكير المراجعة اليومية والتثبيت',
        titleEn: 'Evening Revision & Consolidation Reminder',
        bodyAr: overdueCount > 0
          ? `لديك ${overdueCount} سورة مستحقة للمراجعة اليوم لتثبيت الحفظ.`
          : 'حافظ على متانة حفظك بمراجعة الورد القريب والبعيد قبل نهاية اليوم.',
        bodyEn: overdueCount > 0
          ? `You have ${overdueCount} surah(s) due for spaced-repetition review today.`
          : 'Strengthen your retention with a quick near and far revision session.',
      });
    } else if (rule.type === 'streak_guard' && !todayCompletedHifz && !todayCompletedRevision) {
      triggered.push({
        ruleId: rule.id,
        titleAr: 'تنبيه حماية سلسلة الإنجاز',
        titleEn: 'Daily Streak Protection Alert',
        bodyAr: 'لم تُسجّل إنجازك اليوم بعد. بضع آيات أو مراجعة سريعة تحفظ استمراريتك!',
        bodyEn: 'No study session logged today yet. Even a short revision keeps your streak alive.',
      });
    } else if (rule.type === 'overdue_review' && overdueCount >= 3) {
      triggered.push({
        ruleId: rule.id,
        titleAr: 'تنبيه مراجعة السور المستحقة',
        titleEn: 'Overdue Surah Retention Alert',
        bodyAr: `يوجد ${overdueCount} سورة تجاوزت موعد المراجعة الموصى به.`,
        bodyEn: `${overdueCount} memorized surah(s) have passed their optimal review interval.`,
      });
    }
  }

  return triggered;
}
