import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  ChevronDown,
  Compass,
  Database,
  HardDrive,
  HelpCircle,
  LayoutDashboard,
  Play,
  Repeat,
  SlidersHorizontal,
  Users,
  WifiOff,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { ActiveView, Language } from '../types/quran';

interface GuideViewProps {
  lang: Language;
  isOnline: boolean;
  isOfflineReady: boolean;
  storagePersisted: boolean;
  onNavigate: (view: ActiveView) => void;
  onStartTour: () => void;
  onOpenSetupWizard: () => void;
  onOpenBackupModal: () => void;
}

export function GuideView({
  lang,
  isOfflineReady,
  storagePersisted,
  onNavigate,
  onStartTour,
  onOpenSetupWizard,
  onOpenBackupModal,
}: GuideViewProps) {
  const t = TRANSLATIONS[lang];
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const walkthroughCards: Array<{
    view: ActiveView;
    title: string;
    steps: string[];
    icon: React.ReactNode;
  }> =
    lang === 'ar'
      ? [
          {
            view: 'dashboard',
            title: '١. لوحة المتابعة اليومية',
            steps: [
              'راقب صفحاتك المحفوظة من أصل 604 صفحة ونسبة الحفظ.',
              'أنْهِ مهام الورد الثلاثي يومياً مباشرة من البطاقات السريعة.',
              'تابع الرسم البياني لآخر 14 يوماً والسور المستحقة للمراجعة.',
            ],
            icon: <LayoutDashboard className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'wird',
            title: '٢. الورد اليومي وتقييم التلاوة',
            steps: [
              'سجّل أي جلسة حفظ جديد أو مراجعة قريبة أو بعيدة.',
              'اختر تقييم التلاوة (متقن / جيد / يحتاج تثبيت).',
              'إذا أخطأت في تسجيل جلسة، يمكنك حذفها بضغطة زر وتأكيد.',
            ],
            icon: <BookOpenCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'plans',
            title: '٣. مُنشئ الخطط وإعادة الجدولة',
            steps: [
              'أنشئ خطة للمصحف كاملاً أو أجزاء أو سور محددة، صعوداً أو نزولاً.',
              'اختر مقدارك اليومي (بالصفحات أو الأسطر أو الآيات) وأيام الدراسة.',
              'إن انقطعت يوماً، اضغط «إعادة الجدولة الذكية» لمواءمة التاريخ دون فقدان التقدم.',
            ],
            icon: <CalendarClock className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'revision',
            title: '٤. طابور المراجعة ودورة المَنزِل',
            steps: [
              'تظهر السور المستحقة اليوم أولاً حسب مؤشر قوة التثبيت %.',
              'اضغط مباشرة على (متقن / جيد / يحتاج تثبيت) في الصف لتحديث الموعد.',
              'اضبط مدة ختمة المراجعة (7 أو 14 أو 30 يوماً) ليحسب لك الورد اليومي.',
            ],
            icon: <Repeat className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'map',
            title: '٥. خريطة الـ 114 سورة و30 جزءاً',
            steps: [
              'استعرض السور والأجزاء وتصفّح حالة كل سورة (متقن، تثبيت، قيد الحفظ).',
              'ابحث فوراً بأي اسم سورة واضغط عليها لتحديث عدد الآيات يدوياً.',
              'يمكنك أيضاً استخدام «معالج المحفوظ» لإضافة عدة أجزاء دفعة واحدة.',
            ],
            icon: <Compass className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'reminders',
            title: '٦. التذكيرات وتكامل التقويم',
            steps: [
              'اضبط أوقات تذكير الحفظ والمراجعة أو اختر من أوقات الصلوات المقترحة.',
              'فعّل ساعات الهدوء لمنع التنبيهات ليلاً.',
              'صدّر ملف تقويم (.ics) إلى تقويم هاتفك لتنبيهك حتى عند إغلاق المتصفح.',
            ],
            icon: <BellRing className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
        ]
      : [
          {
            view: 'dashboard',
            title: '1. Progress Dashboard',
            steps: [
              'Track memorized pages out of 604 Mushaf pages and active streaks.',
              'Complete Sabaq, Sabqi, and Manzil tasks right from Today’s checklist.',
              'Review your 14-day study chart and surahs due today.',
            ],
            icon: <LayoutDashboard className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'wird',
            title: '2. Daily Wird & Recitation Rating',
            steps: [
              'Log New Hifz, Near Linking, or Far Revision sessions anytime.',
              'Rate recitation quality (Mutqin / Good / Needs Review).',
              'Remove mistaken log entries cleanly via two-step delete confirmation.',
            ],
            icon: <BookOpenCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'plans',
            title: '3. Plan Builder & Smart Reschedule',
            steps: [
              'Configure plans by full Quran, Juz range, or custom surahs (forward or reverse).',
              'Choose daily pages, lines, or ayahs with instant completion forecasts.',
              'Missed a day? Click Smart Reschedule to shift pending milestones from today.',
            ],
            icon: <CalendarClock className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'revision',
            title: '4. Revision Queue & Manzil Cycle',
            steps: [
              'Due surahs sort by lowest retention strength so nothing is forgotten.',
              'Tap Mutqin / Good / Needs Review right on a surah row to update intervals.',
              'Set your Manzil cycle (7–30 days) for a daily recommended page quota.',
            ],
            icon: <Repeat className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'map',
            title: '5. 114-Surah & 30-Juz Map',
            steps: [
              'Inspect every Surah and Juz by Mushaf pages and retention state.',
              'Search by name or number and click any Surah to update memorized ayahs.',
              'Use the Setup Wizard anytime to seed multiple Juz and Surahs together.',
            ],
            icon: <Compass className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
          {
            view: 'reminders',
            title: '6. Reminders & Native Calendar Sync',
            steps: [
              'Set morning Hifz and evening revision alert schedules with prayer presets.',
              'Enable Quiet Hours to pause sound chimes during rest hours.',
              'Download an .ics file to trigger reminders natively in your phone calendar.',
            ],
            icon: <BellRing className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />,
          },
        ];

  const faqs: Array<{ q: string; a: string }> =
    lang === 'ar'
      ? [
          {
            q: 'كيف أضيف السور والأجزاء التي أحفظها مسبقاً بدون إدخالها واحدة بواحدة؟',
            a: 'اضغط على زر «فتح معالج المحفوظ والخطط» أعلى هذه الصفحة وانتقل للخطوة الثانية؛ يمكنك تحديد أجزاء كاملة (مثل عمّ وتبارك) ودمجها مع سور فردية محددة بضغطة واحدة.',
          },
          {
            q: 'هل يضيع تقدمي إذا انقطع الإنترنت أو أغلقت الهاتف؟',
            a: 'لا. إتقان مبني بالكامل ليعمل بدون إنترنت (Offline-First) ويحفظ بياناتك تلقائياً في مكانين متزامنين على جهازك (localStorage + IndexedDB). ولأمان إضافي يمكنك تصدير نسخة JSON من القائمة الجانبية.',
          },
          {
            q: 'ما الفارق بين التقييمات الثلاثة عند التسميع (متقن / جيد / يحتاج تثبيت)؟',
            a: 'تقييم «متقن» يرفع قوة الحفظ ويباعد موعد المراجعة القادمة، بينما «جيد» يبقيه متوسطاً، أما «يحتاج تثبيت» فيخفض الفاصل إلى يوم واحد فقط ليذكّرك التطبيق بتكرار السورة حتى تثبت.',
          },
          {
            q: 'أين أجد النسخ الاحتياطي وتصفير البيانات التجريبية؟',
            a: 'نُقل زر «البيانات والنسخ الاحتياطي» إلى القائمة الجانبية (أسفل القائمة) لتخفيف الشريط العلوي، كما يمكنك فتحه مباشرة بالزر أعلى هذه الصفحة.',
          },
          {
            q: 'كيف أثبّت إتقان كتطبيق مستقل على الهاتف؟',
            a: 'على Android (Chrome): اختر «تثبيت التطبيق» من القائمة الجانبية أو قائمة المتصفح. على iPhone (Safari): اضغط زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».',
          },
          {
            q: 'هل ستُضاف ميزة التنافس والمراجعة الجماعية لاحقاً؟',
            a: 'نعم بإذن الله في الإصدار الثاني؛ حيث سيُستعمل الإنترنت لتكوين مجموعات خاصة مغلقة تضم من مستخدمين اثنين حتى 10 أصدقاء يستخدمون التطبيق للتنافس الإيجابي ومتابعة الإنجاز اليومي.',
          },
        ]
      : [
          {
            q: 'How do I add previously memorized Juz and Surahs in bulk?',
            a: 'Click "Open Hifz & Plan Setup Wizard" above and go to Step 2. You can combine full Juz toggles (e.g., Juz 29–30) with any individual Surahs in seconds.',
          },
          {
            q: 'Does Itqan keep my progress completely offline?',
            a: 'Yes. Itqan is Offline-First and saves your data locally across both localStorage and IndexedDB automatically. You can also export JSON backups anytime from the Sidebar.',
          },
          {
            q: 'How do quality ratings affect review dates?',
            a: 'Marking a Surah "Mutqin" increases retention and expands the next review interval, "Good" sets a moderate interval, and "Needs Review" schedules it again within 1 day for quick reinforcement.',
          },
          {
            q: 'Where did the Data & Backup manager button go?',
            a: 'To keep the top bar clean and spacious on mobile, Data & Backup lives inside the Sidebar footer (and can also be launched right from this Guide page).',
          },
          {
            q: 'How do I install Itqan as a standalone app on my phone?',
            a: 'On Android Chrome tap "Install App" in the Sidebar or browser menu. On iPhone Safari tap Share -> Add to Home Screen.',
          },
          {
            q: 'When will online features be used?',
            a: 'Core memorization stays 100% offline. Internet connectivity will power Part 2’s Private Competitive Groups where 2 to 10 connected Itqan users can join a ring together.',
          },
        ];

  return (
    <div className="space-y-6">
      {/* Header & Quick Re-entry Controls */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onStartTour}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[11px] sm:text-sm font-medium text-center leading-snug transition-colors"
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>{t.guide.btnStartTour}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSetupWizard}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] sm:text-sm font-medium text-slate-800 dark:text-slate-100 text-center leading-snug transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{t.guide.btnOpenWizard}</span>
          </button>
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 text-center leading-snug transition-colors"
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>{t.guide.btnOpenBackup}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
          <div className="w-full min-w-0 space-y-1">
            <h2 className="font-display text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {t.guide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.guide.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Offline-First Guarantee + Future Private Groups Roadmap */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              <WifiOff className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>{t.guide.offlineBadgeTitle}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <HardDrive className="w-3 h-3" />
              <span>
                {lang === 'ar'
                  ? isOfflineReady || storagePersisted
                    ? 'تطبيق مثبّت ✓'
                    : 'حفظ محلي ✓'
                  : isOfflineReady || storagePersisted
                  ? 'PWA ✓'
                  : 'Local ✓'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {t.guide.offlineBadgeDesc}
          </p>
        </div>

        <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/25 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-950 dark:text-sky-200">
              <Users className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
              <span>{t.guide.multiplayerRoadTitle}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900 text-[11px] font-mono-tabular font-medium text-sky-700 dark:text-sky-400 shrink-0">
              {lang === 'ar' ? '2–10 أعضاء' : '2–10 Users'}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {t.guide.multiplayerRoadDesc}
          </p>
        </div>
      </section>

      {/* Spaced Repetition Visual Explanation */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          {t.guide.methodTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {t.modal.ratingMutqin}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'ترتفع نسبة الحفظ (+12%) ويتضاعف فاصل المراجعة القادم تدريجياً (مثلاً: 7 ← 14 ← 30 يوماً).'
                : 'Boosts retention (+12%) and expands the next review interval progressively.'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {t.modal.ratingGood}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'يحافظ على قوة التثبيت مع زيادة معتدلة في فترة المراجعة للمحافظة على الإتقان.'
                : 'Maintains stability with a moderate review interval step.'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
              {t.modal.ratingNeedsReview}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'يعيد جدولة السورة بعد يوم واحد فقط وتتصدر طابور المراجعة حتى ترسخ تماماً.'
                : 'Resets review interval to 1 day and promotes the surah to top priority.'}
            </p>
          </div>
        </div>
      </section>

      {/* Feature-by-Feature Interactive Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {walkthroughCards.map((card) => (
          <div
            key={card.view}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 shrink-0">
                  {card.icon}
                </span>
                <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {card.title}
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc ps-4 leading-relaxed">
                {card.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(card.view)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-600 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-colors"
            >
              <span>{t.guide.tryNow}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </section>

      {/* Accordion FAQ */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.guide.faqTitle}
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 text-start hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-4 sm:px-6 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
