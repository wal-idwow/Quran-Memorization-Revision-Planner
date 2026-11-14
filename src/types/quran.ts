export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark';

export type RevelationType = 'meccan' | 'medinan';

export interface Surah {
  id: number;
  nameAr: string;
  nameEn: string;
  transliteration: string;
  ayahCount: number;
  pageStart: number;
  pageEnd: number;
  juzStart: number;
  juzEnd: number;
  revelationType: RevelationType;
}

export interface JuzInfo {
  id: number;
  nameAr: string;
  nameEn: string;
  pageStart: number;
  pageEnd: number;
  surahStart: number;
  surahEnd: number;
}

export type MasteryStatus = 'not_started' | 'learning' | 'reviewing' | 'mastered';

export interface SurahProgress {
  surahId: number;
  memorizedAyahs: number;
  status: MasteryStatus;
  retentionScore: number; // 0 - 100
  intervalDays: number;
  lastReviewedAt: string | null; // ISO date YYYY-MM-DD
  nextReviewAt: string | null; // ISO date YYYY-MM-DD
  reviewCount: number;
  lastRating?: QualityRating;
}

export type QualityRating = 'mutqin' | 'good' | 'needs_review';

export type PlanScopeType = 'full_quran' | 'juz_range' | 'surah_range' | 'custom_surahs';
export type PlanDirection = 'forward' | 'reverse';
export type DailyUnit = 'pages' | 'lines' | 'ayahs';

export interface MemorizationPlan {
  id: string;
  name: string;
  scopeType: PlanScopeType;
  juzFrom?: number;
  juzTo?: number;
  surahFrom?: number;
  surahTo?: number;
  customSurahIds?: number[];
  direction: PlanDirection;
  dailyAmount: number; // e.g., 1 page, 5 lines, 10 ayahs
  dailyUnit: DailyUnit;
  activeDaysPerWeek: number; // 5, 6, or 7
  revisionCycleDays: number; // e.g., 7, 14, 30
  startDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  completedDaysCount: number;
}

export interface PlanDayTarget {
  dayIndex: number;
  date: string; // YYYY-MM-DD
  surahId: number;
  surahNameAr: string;
  surahNameEn: string;
  ayahFrom: number;
  ayahTo: number;
  pageFrom: number;
  pageTo: number;
  estimatedAyahs: number;
  estimatedPages: number;
  isCompleted: boolean;
}

export type SessionType = 'new_hifz' | 'near_revision' | 'far_revision';

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  type: SessionType;
  surahId: number;
  ayahFrom: number;
  ayahTo: number;
  pagesCovered: number;
  durationMinutes: number;
  rating: QualityRating;
  notes?: string;
}

export interface ReminderRule {
  id: string;
  type: 'daily_hifz' | 'evening_revision' | 'streak_guard' | 'overdue_review';
  enabled: boolean;
  time: string; // HH:mm
  labelAr: string;
  labelEn: string;
  daysOfWeek: number[]; // 0 = Sun ... 6 = Sat
}

export interface ReminderSettings {
  browserNotificationsEnabled: boolean;
  soundChimeEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStart: string; // HH:mm
  quietEnd: string; // HH:mm
  rules: ReminderRule[];
  lastNotifiedMap: Record<string, string>; // ruleId -> YYYY-MM-DD
}

export interface AppNotification {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  createdAt: string;
  read: boolean;
  category: 'reminder' | 'milestone' | 'revision';
}

export type ActiveView =
  | 'dashboard'
  | 'wird'
  | 'plans'
  | 'revision'
  | 'map'
  | 'reminders';
