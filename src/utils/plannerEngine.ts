import { LINES_PER_PAGE, SURAHS, SURAH_MAP, TOTAL_QURAN_AYAHS, TOTAL_QURAN_PAGES } from '../data/quranData';
import {
  MemorizationPlan,
  PlanDayTarget,
  QualityRating,
  StudySession,
  Surah,
  SurahProgress,
} from '../types/quran';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function daysBetweenISO(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split('-').map(Number);
  const [y2, m2, d2] = toISO.split('-').map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

export function getSurahsForPlan(plan: Pick<MemorizationPlan, 'scopeType' | 'juzFrom' | 'juzTo' | 'surahFrom' | 'surahTo' | 'customSurahIds' | 'direction'>): Surah[] {
  let list: Surah[] = [];
  if (plan.scopeType === 'full_quran') {
    list = [...SURAHS];
  } else if (plan.scopeType === 'juz_range') {
    const jFrom = Math.min(plan.juzFrom ?? 1, plan.juzTo ?? 30);
    const jTo = Math.max(plan.juzFrom ?? 1, plan.juzTo ?? 30);
    list = SURAHS.filter((s) => s.juzEnd >= jFrom && s.juzStart <= jTo);
  } else if (plan.scopeType === 'surah_range') {
    const sFrom = Math.min(plan.surahFrom ?? 1, plan.surahTo ?? 114);
    const sTo = Math.max(plan.surahFrom ?? 1, plan.surahTo ?? 114);
    list = SURAHS.filter((s) => s.id >= sFrom && s.id <= sTo);
  } else if (plan.scopeType === 'custom_surahs') {
    const ids = new Set(plan.customSurahIds ?? []);
    list = SURAHS.filter((s) => ids.has(s.id));
  }

  if (plan.direction === 'reverse') {
    return [...list].reverse();
  }
  return list;
}

export function estimateSurahPages(surah: Surah): number {
  return Math.max(0.5, surah.pageEnd - surah.pageStart + 1);
}

export function getPlanStats(plan: Pick<MemorizationPlan, 'scopeType' | 'juzFrom' | 'juzTo' | 'surahFrom' | 'surahTo' | 'customSurahIds' | 'direction' | 'dailyAmount' | 'dailyUnit' | 'activeDaysPerWeek' | 'startDate'>) {
  const surahs = getSurahsForPlan(plan);
  const totalAyahs = surahs.reduce((sum, s) => sum + s.ayahCount, 0);

  // Calculate exact unique page span if contiguous, or sum of surah page weights
  let totalPages = 0;
  if (plan.scopeType === 'full_quran') {
    totalPages = TOTAL_QURAN_PAGES;
  } else if (surahs.length > 0) {
    const pageSet = new Set<number>();
    surahs.forEach((s) => {
      for (let p = s.pageStart; p <= s.pageEnd; p++) pageSet.add(p);
    });
    totalPages = pageSet.size;
  }

  // Average ayahs per page across chosen surahs
  const avgAyahsPerPage = totalPages > 0 ? totalAyahs / totalPages : 15;
  let dailyAyahEquivalent = 10;
  if (plan.dailyUnit === 'ayahs') {
    dailyAyahEquivalent = Math.max(1, plan.dailyAmount);
  } else if (plan.dailyUnit === 'pages') {
    dailyAyahEquivalent = Math.max(1, plan.dailyAmount * avgAyahsPerPage);
  } else {
    // lines
    dailyAyahEquivalent = Math.max(1, (plan.dailyAmount / LINES_PER_PAGE) * avgAyahsPerPage);
  }

  const activeStudyDays = Math.max(1, Math.ceil(totalAyahs / dailyAyahEquivalent));
  const calendarDays = Math.ceil((activeStudyDays * 7) / Math.max(1, Math.min(7, plan.activeDaysPerWeek)));
  const estimatedEndDate = addDaysISO(plan.startDate || getTodayISO(), Math.max(0, calendarDays - 1));

  return {
    surahCount: surahs.length,
    totalAyahs,
    totalPages,
    activeStudyDays,
    calendarDays,
    estimatedEndDate,
  };
}

export function generatePlanSchedule(plan: MemorizationPlan, limitDays = 180): PlanDayTarget[] {
  const surahs = getSurahsForPlan(plan);
  if (surahs.length === 0) return [];

  const totalAyahs = surahs.reduce((sum, s) => sum + s.ayahCount, 0);
  const pageSet = new Set<number>();
  surahs.forEach((s) => {
    for (let p = s.pageStart; p <= s.pageEnd; p++) pageSet.add(p);
  });
  const totalPages = Math.max(1, pageSet.size);
  const avgAyahsPerPage = totalAyahs / totalPages;

  const schedule: PlanDayTarget[] = [];
  let surahIdx = 0;
  let currentAyahOffset = 1;
  let studyDayCounter = 0;
  let calendarOffset = 0;

  while (surahIdx < surahs.length && schedule.length < limitDays) {
    // Skip rest days if activeDaysPerWeek < 7
    const daySlotInWeek = calendarOffset % 7;
    if (daySlotInWeek >= plan.activeDaysPerWeek) {
      calendarOffset++;
      continue;
    }

    const surah = surahs[surahIdx];
    const surahPages = Math.max(1, surah.pageEnd - surah.pageStart + 1);
    const surahAyahsPerPage = surah.ayahCount / surahPages;

    let ayahsTarget = 1;
    if (plan.dailyUnit === 'ayahs') {
      ayahsTarget = Math.max(1, Math.round(plan.dailyAmount));
    } else if (plan.dailyUnit === 'pages') {
      ayahsTarget = Math.max(1, Math.round(plan.dailyAmount * surahAyahsPerPage));
    } else {
      ayahsTarget = Math.max(1, Math.round((plan.dailyAmount / LINES_PER_PAGE) * avgAyahsPerPage));
    }

    const remainingInSurah = surah.ayahCount - currentAyahOffset + 1;
    const ayahsForToday = Math.min(ayahsTarget, remainingInSurah);
    const ayahFrom = currentAyahOffset;
    const ayahTo = currentAyahOffset + ayahsForToday - 1;

    const progressFrom = (ayahFrom - 1) / surah.ayahCount;
    const progressTo = ayahTo / surah.ayahCount;
    const pageFrom = Math.min(
      surah.pageEnd,
      surah.pageStart + Math.floor(progressFrom * surahPages)
    );
    const pageTo = Math.min(
      surah.pageEnd,
      Math.max(pageFrom, surah.pageStart + Math.ceil(progressTo * surahPages) - 1)
    );

    const estPages = Number((ayahsForToday / Math.max(1, surahAyahsPerPage)).toFixed(1));

    schedule.push({
      dayIndex: studyDayCounter + 1,
      date: addDaysISO(plan.startDate, calendarOffset),
      surahId: surah.id,
      surahNameAr: surah.nameAr,
      surahNameEn: surah.transliteration,
      ayahFrom,
      ayahTo,
      pageFrom,
      pageTo,
      estimatedAyahs: ayahsForToday,
      estimatedPages: Math.max(0.1, estPages),
      isCompleted: studyDayCounter < plan.completedDaysCount,
    });

    studyDayCounter++;
    calendarOffset++;

    if (ayahTo >= surah.ayahCount) {
      surahIdx++;
      currentAyahOffset = 1;
    } else {
      currentAyahOffset = ayahTo + 1;
    }
  }

  return schedule;
}

export function applySessionToProgress(
  currentMap: Record<number, SurahProgress>,
  session: StudySession
): Record<number, SurahProgress> {
  const surah = SURAH_MAP[session.surahId];
  if (!surah) return currentMap;

  const existing: SurahProgress = currentMap[session.surahId] ?? {
    surahId: session.surahId,
    memorizedAyahs: 0,
    status: 'not_started',
    retentionScore: 0,
    intervalDays: 1,
    lastReviewedAt: null,
    nextReviewAt: null,
    reviewCount: 0,
  };

  let nextMemorized = existing.memorizedAyahs;
  if (session.type === 'new_hifz') {
    nextMemorized = Math.min(surah.ayahCount, Math.max(existing.memorizedAyahs, session.ayahTo));
  } else if (existing.memorizedAyahs === 0) {
    nextMemorized = Math.min(surah.ayahCount, session.ayahTo);
  }

  // Spaced Repetition interval & retention calculation
  let nextInterval = existing.intervalDays || 1;
  let nextRetention = existing.retentionScore || 75;

  if (session.rating === 'mutqin') {
    nextInterval = existing.reviewCount === 0 ? 3 : Math.min(30, Math.round(nextInterval * 2.1));
    nextRetention = Math.min(100, Math.max(82, (existing.retentionScore || 75) + 12));
  } else if (session.rating === 'good') {
    nextInterval = existing.reviewCount === 0 ? 2 : Math.min(14, Math.max(2, Math.round(nextInterval * 1.4)));
    nextRetention = Math.min(92, Math.max(65, (existing.retentionScore || 70) + 4));
  } else {
    // needs_review
    nextInterval = 1;
    nextRetention = Math.max(35, (existing.retentionScore || 65) - 18);
  }

  let status: SurahProgress['status'] = existing.status;
  if (nextMemorized >= surah.ayahCount) {
    status = nextRetention >= 85 && existing.reviewCount >= 1 ? 'mastered' : 'reviewing';
  } else if (nextMemorized > 0) {
    status = 'learning';
  }

  const nextReviewAt = addDaysISO(session.date, nextInterval);

  return {
    ...currentMap,
    [session.surahId]: {
      surahId: session.surahId,
      memorizedAyahs: nextMemorized,
      status,
      retentionScore: nextRetention,
      intervalDays: nextInterval,
      lastReviewedAt: session.date,
      nextReviewAt,
      reviewCount: existing.reviewCount + 1,
      lastRating: session.rating,
    },
  };
}

export function calculateStreak(sessions: StudySession[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };
  const uniqueDates = Array.from(new Set(sessions.map((s) => s.date))).sort();
  if (uniqueDates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (daysBetweenISO(uniqueDates[i - 1], uniqueDates[i]) === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const today = getTodayISO();
  const yesterday = addDaysISO(today, -1);
  const lastDate = uniqueDates[uniqueDates.length - 1];
  if (lastDate !== today && lastDate !== yesterday) {
    return { current: 0, best };
  }

  let current = 1;
  for (let i = uniqueDates.length - 2; i >= 0; i--) {
    if (daysBetweenISO(uniqueDates[i], uniqueDates[i + 1]) === 1) {
      current++;
    } else {
      break;
    }
  }

  return { current, best: Math.max(best, current) };
}

export function calculateMemorizedSummary(progressMap: Record<number, SurahProgress>) {
  let memorizedAyahs = 0;
  let memorizedPages = 0;
  let completedSurahs = 0;
  let masteredSurahs = 0;

  for (const surah of SURAHS) {
    const p = progressMap[surah.id];
    if (!p || p.memorizedAyahs <= 0) continue;
    const ayahs = Math.min(surah.ayahCount, p.memorizedAyahs);
    memorizedAyahs += ayahs;
    const surahPages = surah.pageEnd - surah.pageStart + 1;
    memorizedPages += (ayahs / surah.ayahCount) * surahPages;
    if (ayahs >= surah.ayahCount) {
      completedSurahs++;
      if (p.status === 'mastered') masteredSurahs++;
    }
  }

  const percentQuran = Number(((memorizedAyahs / TOTAL_QURAN_AYAHS) * 100).toFixed(1));
  const roundedPages = Number(Math.min(TOTAL_QURAN_PAGES, memorizedPages).toFixed(1));

  return {
    memorizedAyahs,
    memorizedPages: roundedPages,
    percentQuran,
    completedSurahs,
    masteredSurahs,
  };
}

export function generateReminderICS(timeHHMM: string, title: string, description: string): string {
  const [hourStr, minStr] = timeHHMM.split(':');
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dtStart = `${y}${m}${d}T${hourStr}${minStr}00`;
  const endMin = String((Number(minStr) + 25) % 60).padStart(2, '0');
  const endHour = Number(minStr) + 25 >= 60 ? String((Number(hourStr) + 1) % 24).padStart(2, '0') : hourStr;
  const dtEnd = `${y}${m}${d}T${endHour}${endMin}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Itqan Quran Planner//EN',
    'BEGIN:VEVENT',
    `UID:itqan-wird-${Date.now()}@itqan.app`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
