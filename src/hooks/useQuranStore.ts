import { useCallback, useEffect, useMemo, useState } from 'react';
import { SURAH_MAP } from '../data/quranData';
import {
  ActiveView,
  AppNotification,
  Language,
  MemorizationPlan,
  QualityRating,
  ReminderSettings,
  StudySession,
  SurahProgress,
  ThemeMode,
} from '../types/quran';
import {
  dispatchSystemNotification,
  evaluateDueReminders,
} from '../utils/notificationEngine';
import {
  addDaysISO,
  applySessionToProgress,
  calculateMemorizedSummary,
  calculateStreak,
  generatePlanSchedule,
  getTodayISO,
} from '../utils/plannerEngine';

const STORAGE_KEY = 'itqan_quran_planner_v1';

interface StoredState {
  lang: Language;
  theme: ThemeMode;
  plans: MemorizationPlan[];
  sessions: StudySession[];
  progressMap: Record<number, SurahProgress>;
  reminderSettings: ReminderSettings;
  notifications: AppNotification[];
  manzilCycleDays: number;
}

function buildInitialState(): StoredState {
  const today = getTodayISO();
  const initialPlan: MemorizationPlan = {
    id: 'plan-juz-amma',
    name: 'خطة تثبيت وإتقان جزء عمّ وتبارك',
    scopeType: 'juz_range',
    juzFrom: 29,
    juzTo: 30,
    direction: 'reverse',
    dailyAmount: 1,
    dailyUnit: 'pages',
    activeDaysPerWeek: 6,
    revisionCycleDays: 7,
    startDate: addDaysISO(today, -6),
    isActive: true,
    createdAt: new Date().toISOString(),
    completedDaysCount: 6,
  };

  const secondaryPlan: MemorizationPlan = {
    id: 'plan-baqarah',
    name: 'Al-Baqarah Deep Memorization',
    scopeType: 'surah_range',
    surahFrom: 2,
    surahTo: 2,
    direction: 'forward',
    dailyAmount: 7,
    dailyUnit: 'lines',
    activeDaysPerWeek: 5,
    revisionCycleDays: 14,
    startDate: today,
    isActive: false,
    createdAt: new Date().toISOString(),
    completedDaysCount: 0,
  };

  const starterSessions: StudySession[] = [
    {
      id: 'sess-1',
      date: addDaysISO(today, -6),
      timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
      type: 'new_hifz',
      surahId: 114,
      ayahFrom: 1,
      ayahTo: 6,
      pagesCovered: 0.5,
      durationMinutes: 18,
      rating: 'mutqin',
    },
    {
      id: 'sess-2',
      date: addDaysISO(today, -5),
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      type: 'new_hifz',
      surahId: 113,
      ayahFrom: 1,
      ayahTo: 5,
      pagesCovered: 0.5,
      durationMinutes: 15,
      rating: 'mutqin',
    },
    {
      id: 'sess-3',
      date: addDaysISO(today, -4),
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
      type: 'new_hifz',
      surahId: 112,
      ayahFrom: 1,
      ayahTo: 4,
      pagesCovered: 0.4,
      durationMinutes: 12,
      rating: 'mutqin',
    },
    {
      id: 'sess-4',
      date: addDaysISO(today, -3),
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      type: 'new_hifz',
      surahId: 109,
      ayahFrom: 1,
      ayahTo: 6,
      pagesCovered: 0.6,
      durationMinutes: 20,
      rating: 'good',
    },
    {
      id: 'sess-5',
      date: addDaysISO(today, -2),
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      type: 'near_revision',
      surahId: 103,
      ayahFrom: 1,
      ayahTo: 3,
      pagesCovered: 0.4,
      durationMinutes: 15,
      rating: 'mutqin',
    },
    {
      id: 'sess-6',
      date: addDaysISO(today, -1),
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      type: 'new_hifz',
      surahId: 93,
      ayahFrom: 1,
      ayahTo: 11,
      pagesCovered: 1.0,
      durationMinutes: 25,
      rating: 'good',
    },
    {
      id: 'sess-7',
      date: addDaysISO(today, -1),
      timestamp: new Date(Date.now() - 1 * 86400000 + 3600000).toISOString(),
      type: 'far_revision',
      surahId: 67,
      ayahFrom: 1,
      ayahTo: 30,
      pagesCovered: 2.5,
      durationMinutes: 22,
      rating: 'needs_review',
      notes: 'مراجعة سورة الملك مع التركيز على أواخر الآيات',
    },
  ];

  // Build progress map from starter sessions + a couple of due surahs to show spaced repetition in action
  let progressMap: Record<number, SurahProgress> = {
    1: {
      surahId: 1,
      memorizedAyahs: 7,
      status: 'mastered',
      retentionScore: 98,
      intervalDays: 30,
      lastReviewedAt: addDaysISO(today, -2),
      nextReviewAt: addDaysISO(today, 28),
      reviewCount: 8,
      lastRating: 'mutqin',
    },
    87: {
      surahId: 87,
      memorizedAyahs: 19,
      status: 'reviewing',
      retentionScore: 71,
      intervalDays: 3,
      lastReviewedAt: addDaysISO(today, -4),
      nextReviewAt: today,
      reviewCount: 2,
      lastRating: 'good',
    },
    78: {
      surahId: 78,
      memorizedAyahs: 40,
      status: 'reviewing',
      retentionScore: 54,
      intervalDays: 2,
      lastReviewedAt: addDaysISO(today, -5),
      nextReviewAt: addDaysISO(today, -2),
      reviewCount: 1,
      lastRating: 'needs_review',
    },
  };

  for (const s of starterSessions) {
    progressMap = applySessionToProgress(progressMap, s);
  }
  // Ensure Surah 67 shows due today from needs_review yesterday
  if (progressMap[67]) {
    progressMap[67] = {
      ...progressMap[67],
      nextReviewAt: today,
    };
  }

  const reminderSettings: ReminderSettings = {
    browserNotificationsEnabled: false,
    soundChimeEnabled: true,
    quietHoursEnabled: true,
    quietStart: '22:30',
    quietEnd: '04:30',
    lastNotifiedMap: {},
    rules: [
      {
        id: 'rule-daily-hifz',
        type: 'daily_hifz',
        enabled: true,
        time: '05:30',
        labelAr: 'تذكير ورد الحفظ الجديد',
        labelEn: 'Daily New Memorization Wird',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: 'rule-evening-revision',
        type: 'evening_revision',
        enabled: true,
        time: '18:30',
        labelAr: 'تذكير المراجعة والربط المسائي',
        labelEn: 'Evening Revision & Linking Reminder',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: 'rule-streak-guard',
        type: 'streak_guard',
        enabled: true,
        time: '21:15',
        labelAr: 'تنبيه حماية سلسلة الإنجاز اليومي',
        labelEn: 'Daily Streak Protection Alert',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        id: 'rule-overdue-review',
        type: 'overdue_review',
        enabled: true,
        time: '16:15',
        labelAr: 'تنبيه السور المستحقة للمراجعة',
        labelEn: 'Overdue Surah Retention Alert',
        daysOfWeek: [0, 2, 4, 6],
      },
    ],
  };

  const notifications: AppNotification[] = [
    {
      id: 'notif-welcome',
      titleAr: 'جدول المراجعة اليومي جاهز',
      titleEn: 'Daily Revision Queue Ready',
      bodyAr: 'لديك 3 سور مستحقة للمراجعة اليوم للحفاظ على قوة التثبيت.',
      bodyEn: 'You have 3 memorized surahs due for spaced-repetition review today.',
      createdAt: new Date().toISOString(),
      read: false,
      category: 'revision',
    },
  ];

  return {
    lang: 'ar',
    theme: 'light',
    plans: [initialPlan, secondaryPlan],
    sessions: starterSessions,
    progressMap,
    reminderSettings,
    notifications,
    manzilCycleDays: 7,
  };
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed || !Array.isArray(parsed.plans)) {
      return buildInitialState();
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}

export function useQuranStore() {
  const [state, setState] = useState<StoredState>(loadState);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Sync HTML dir, lang, and .dark class
  useEffect(() => {
    const html = document.documentElement;
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    if (state.theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [state.lang, state.theme]);

  const todayISO = getTodayISO();

  const todaySessions = useMemo(
    () => state.sessions.filter((s) => s.date === todayISO),
    [state.sessions, todayISO]
  );

  const todayCompletedHifz = useMemo(
    () => todaySessions.some((s) => s.type === 'new_hifz'),
    [todaySessions]
  );

  const todayCompletedNearRevision = useMemo(
    () => todaySessions.some((s) => s.type === 'near_revision'),
    [todaySessions]
  );

  const todayCompletedFarRevision = useMemo(
    () => todaySessions.some((s) => s.type === 'far_revision'),
    [todaySessions]
  );

  // Background smart reminder ticker (checks every 30s)
  useEffect(() => {
    const checkReminders = () => {
      const triggered = evaluateDueReminders({
        settings: state.reminderSettings,
        todayCompletedHifz,
        todayCompletedRevision: todayCompletedNearRevision || todayCompletedFarRevision,
        progressMap: state.progressMap,
        lang: state.lang,
      });

      if (triggered.length === 0) return;

      const today = getTodayISO();
      const newNotifs: AppNotification[] = [];
      const updatedMap = { ...state.reminderSettings.lastNotifiedMap };

      for (const item of triggered) {
        updatedMap[item.ruleId] = today;
        const title = state.lang === 'ar' ? item.titleAr : item.titleEn;
        const body = state.lang === 'ar' ? item.bodyAr : item.bodyEn;
        if (state.reminderSettings.browserNotificationsEnabled) {
          dispatchSystemNotification(title, body, state.reminderSettings.soundChimeEnabled);
        }
        newNotifs.push({
          id: `notif-${item.ruleId}-${Date.now()}`,
          titleAr: item.titleAr,
          titleEn: item.titleEn,
          bodyAr: item.bodyAr,
          bodyEn: item.bodyEn,
          createdAt: new Date().toISOString(),
          read: false,
          category: 'reminder',
        });
      }

      setState((prev) => ({
        ...prev,
        reminderSettings: {
          ...prev.reminderSettings,
          lastNotifiedMap: {
            ...prev.reminderSettings.lastNotifiedMap,
            ...updatedMap,
          },
        },
        notifications: [...newNotifs, ...prev.notifications].slice(0, 30),
      }));
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(timer);
  }, [
    state.reminderSettings,
    state.progressMap,
    state.lang,
    todayCompletedHifz,
    todayCompletedNearRevision,
    todayCompletedFarRevision,
  ]);

  const activePlan = useMemo(
    () => state.plans.find((p) => p.isActive) ?? state.plans[0] ?? null,
    [state.plans]
  );

  const activeSchedule = useMemo(
    () => (activePlan ? generatePlanSchedule(activePlan, 180) : []),
    [activePlan]
  );

  const nextPlanDayTarget = useMemo(
    () => activeSchedule.find((d) => !d.isCompleted) ?? null,
    [activeSchedule]
  );

  const memorizedSummary = useMemo(
    () => calculateMemorizedSummary(state.progressMap),
    [state.progressMap]
  );

  const streak = useMemo(
    () => calculateStreak(state.sessions),
    [state.sessions]
  );

  const dueSurahs = useMemo(() => {
    return Object.values(state.progressMap)
      .filter((p) => p.memorizedAyahs > 0 && (!p.nextReviewAt || p.nextReviewAt <= todayISO))
      .sort((a, b) => (a.retentionScore ?? 0) - (b.retentionScore ?? 0));
  }, [state.progressMap, todayISO]);

  const avgRetention = useMemo(() => {
    const memorized = Object.values(state.progressMap).filter((p) => p.memorizedAyahs > 0);
    if (memorized.length === 0) return 0;
    const sum = memorized.reduce((acc, p) => acc + p.retentionScore, 0);
    return Math.round(sum / memorized.length);
  }, [state.progressMap]);

  const setLang = useCallback((lang: Language) => {
    setState((prev) => ({ ...prev, lang }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const logSession = useCallback(
    (input: Omit<StudySession, 'id' | 'timestamp'>) => {
      const surah = SURAH_MAP[input.surahId];
      if (!surah) return;

      const surahPages = Math.max(1, surah.pageEnd - surah.pageStart + 1);
      const ayahsCovered = Math.max(1, input.ayahTo - input.ayahFrom + 1);
      const computedPages =
        input.pagesCovered > 0
          ? input.pagesCovered
          : Number(((ayahsCovered / surah.ayahCount) * surahPages).toFixed(1));

      const newSession: StudySession = {
        ...input,
        id: `sess-${Date.now()}`,
        timestamp: new Date().toISOString(),
        pagesCovered: Math.max(0.1, computedPages),
      };

      setState((prev) => {
        const nextProgress = applySessionToProgress(prev.progressMap, newSession);
        const updatedPlans = prev.plans.map((p) => {
          if (p.isActive && input.type === 'new_hifz') {
            return { ...p, completedDaysCount: p.completedDaysCount + 1 };
          }
          return p;
        });

        const milestoneNotif: AppNotification | null =
          nextProgress[input.surahId]?.memorizedAyahs === surah.ayahCount &&
          (prev.progressMap[input.surahId]?.memorizedAyahs ?? 0) < surah.ayahCount
            ? {
                id: `notif-milestone-${Date.now()}`,
                titleAr: `مبارك إتمام حفظ سورة ${surah.nameAr}`,
                titleEn: `Completed Memorizing ${surah.transliteration}`,
                bodyAr: 'تمت إضافة السورة تلقائياً إلى دورة المراجعة الذكية لتثبيتها.',
                bodyEn: 'This surah has been automatically added to your spaced-repetition revision cycle.',
                createdAt: new Date().toISOString(),
                read: false,
                category: 'milestone',
              }
            : null;

        return {
          ...prev,
          sessions: [newSession, ...prev.sessions],
          progressMap: nextProgress,
          plans: updatedPlans,
          notifications: milestoneNotif
            ? [milestoneNotif, ...prev.notifications].slice(0, 30)
            : prev.notifications,
        };
      });
    },
    []
  );

  const createPlan = useCallback(
    (planData: Omit<MemorizationPlan, 'id' | 'createdAt' | 'completedDaysCount' | 'isActive'>) => {
      const newPlan: MemorizationPlan = {
        ...planData,
        id: `plan-${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        completedDaysCount: 0,
      };
      setState((prev) => ({
        ...prev,
        plans: [newPlan, ...prev.plans.map((p) => ({ ...p, isActive: false }))],
      }));
    },
    []
  );

  const activatePlan = useCallback((planId: string) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => ({ ...p, isActive: p.id === planId })),
    }));
  }, []);

  const deletePlan = useCallback((planId: string) => {
    setState((prev) => {
      const remaining = prev.plans.filter((p) => p.id !== planId);
      if (remaining.length > 0 && !remaining.some((p) => p.isActive)) {
        remaining[0] = { ...remaining[0], isActive: true };
      }
      return { ...prev, plans: remaining };
    });
  }, []);

  const rescheduleActivePlanFromToday = useCallback((planId: string) => {
    const today = getTodayISO();
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              startDate: addDaysISO(today, -p.completedDaysCount),
            }
          : p
      ),
    }));
  }, []);

  const updateSurahManualProgress = useCallback(
    (surahId: number, memorizedAyahs: number, rating: QualityRating = 'good') => {
      const surah = SURAH_MAP[surahId];
      if (!surah) return;
      const clamped = Math.max(0, Math.min(surah.ayahCount, memorizedAyahs));
      const today = getTodayISO();

      setState((prev) => {
        if (clamped === 0) {
          const copy = { ...prev.progressMap };
          delete copy[surahId];
          return { ...prev, progressMap: copy };
        }
        const existing = prev.progressMap[surahId];
        const status: SurahProgress['status'] =
          clamped >= surah.ayahCount
            ? rating === 'mutqin'
              ? 'mastered'
              : 'reviewing'
            : 'learning';

        return {
          ...prev,
          progressMap: {
            ...prev.progressMap,
            [surahId]: {
              surahId,
              memorizedAyahs: clamped,
              status,
              retentionScore:
                rating === 'mutqin' ? 92 : rating === 'good' ? 76 : 55,
              intervalDays: rating === 'mutqin' ? 7 : rating === 'good' ? 3 : 1,
              lastReviewedAt: today,
              nextReviewAt: addDaysISO(
                today,
                rating === 'mutqin' ? 7 : rating === 'good' ? 3 : 1
              ),
              reviewCount: (existing?.reviewCount ?? 0) + 1,
              lastRating: rating,
            },
          },
        };
      });
    },
    []
  );

  const updateReminderSettings = useCallback((updater: (prev: ReminderSettings) => ReminderSettings) => {
    setState((prev) => ({
      ...prev,
      reminderSettings: updater(prev.reminderSettings),
    }));
  }, []);

  const setManzilCycleDays = useCallback((days: number) => {
    setState((prev) => ({ ...prev, manzilCycleDays: days }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const triggerTestNotification = useCallback(() => {
    const title =
      state.lang === 'ar'
        ? 'تذكير إتقان: ورد القرآن الكريم'
        : 'Itqan Reminder: Daily Quran Wird';
    const body =
      state.lang === 'ar'
        ? 'تنبيه تجريبي ناجح! إشعارات التذكير اليومي تعمل الآن بشكل سليم.'
        : 'Test alert succeeded! Your smart daily Quran reminders are ready.';

    const sentNative = dispatchSystemNotification(
      title,
      body,
      state.reminderSettings.soundChimeEnabled
    );

    setState((prev) => ({
      ...prev,
      notifications: [
        {
          id: `notif-test-${Date.now()}`,
          titleAr: 'تنبيه تجريبي ذكي',
          titleEn: 'Smart Test Notification',
          bodyAr: sentNative
            ? 'تم إرسال إشعار المتصفح وتشغيل نغمة التنبيه بنجاح.'
            : 'تم تسجيل التنبيه داخل التطبيق بنجاح (فعّل إذن المتصفح لإشعارات سطح المكتب).',
          bodyEn: sentNative
            ? 'Browser notification dispatched and gentle chime played.'
            : 'In-app alert recorded (grant browser permission for desktop popups).',
          createdAt: new Date().toISOString(),
          read: false,
          category: 'reminder' as const,
        },
        ...prev.notifications,
      ].slice(0, 30),
    }));
  }, [state.lang, state.reminderSettings.soundChimeEnabled]);

  const resetDemoData = useCallback(() => {
    const fresh = buildInitialState();
    setState((prev) => ({
      ...fresh,
      lang: prev.lang,
      theme: prev.theme,
    }));
  }, []);

  return {
    state,
    activeView,
    setActiveView,
    activePlan,
    activeSchedule,
    nextPlanDayTarget,
    memorizedSummary,
    streak,
    dueSurahs,
    avgRetention,
    todaySessions,
    todayCompletedHifz,
    todayCompletedNearRevision,
    todayCompletedFarRevision,
    setLang,
    toggleTheme,
    logSession,
    createPlan,
    activatePlan,
    deletePlan,
    rescheduleActivePlanFromToday,
    updateSurahManualProgress,
    updateReminderSettings,
    setManzilCycleDays,
    markNotificationRead,
    markAllNotificationsRead,
    triggerTestNotification,
    resetDemoData,
  };
}
