import React, { useState } from 'react';
import { DailyWirdView } from './components/DailyWirdView';
import { DashboardView } from './components/DashboardView';
import { LogSessionModal } from './components/LogSessionModal';
import { PlansView } from './components/PlansView';
import { QuranMapView } from './components/QuranMapView';
import { RemindersView } from './components/RemindersView';
import { RevisionView } from './components/RevisionView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SURAH_MAP } from './data/quranData';
import { useQuranStore } from './hooks/useQuranStore';
import { QualityRating, SessionType } from './types/quran';
import { getTodayISO } from './utils/plannerEngine';

export default function App() {
  const {
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
  } = useQuranStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<{
    type: SessionType;
    surahId: number;
    ayahFrom: number;
    ayahTo: number;
  }>({
    type: 'new_hifz',
    surahId: nextPlanDayTarget?.surahId ?? 92,
    ayahFrom: nextPlanDayTarget?.ayahFrom ?? 1,
    ayahTo: nextPlanDayTarget?.ayahTo ?? 21,
  });

  const handleOpenQuickLog = (opts: {
    type: SessionType;
    surahId: number;
    ayahFrom: number;
    ayahTo: number;
  }) => {
    setModalInitial(opts);
    setLogModalOpen(true);
  };

  const handleOpenDefaultLog = () => {
    setModalInitial({
      type: 'new_hifz',
      surahId: nextPlanDayTarget?.surahId ?? 92,
      ayahFrom: nextPlanDayTarget?.ayahFrom ?? 1,
      ayahTo: nextPlanDayTarget?.ayahTo ?? 21,
    });
    setLogModalOpen(true);
  };

  const handleDirectRateRevision = (surahId: number, rating: QualityRating) => {
    const surah = SURAH_MAP[surahId];
    if (!surah) return;
    const pages = Math.max(0.5, Number((surah.pageEnd - surah.pageStart + 1).toFixed(1)));
    logSession({
      date: getTodayISO(),
      type: 'far_revision',
      surahId,
      ayahFrom: 1,
      ayahTo: surah.ayahCount,
      pagesCovered: pages,
      durationMinutes: 15,
      rating,
    });
  };

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        lang={state.lang}
        theme={state.theme}
        activeView={activeView}
        unreadCount={unreadCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectView={setActiveView}
        onToggleTheme={toggleTheme}
        onToggleLang={() => setLang(state.lang === 'ar' ? 'en' : 'ar')}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          lang={state.lang}
          activeView={activeView}
          notifications={state.notifications}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleLang={() => setLang(state.lang === 'ar' ? 'en' : 'ar')}
          onOpenLogModal={handleOpenDefaultLog}
          onMarkNotificationRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
          onNavigateReminders={() => setActiveView('reminders')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              lang={state.lang}
              activePlan={activePlan}
              nextPlanDayTarget={nextPlanDayTarget}
              memorizedSummary={memorizedSummary}
              streak={streak}
              avgRetention={avgRetention}
              dueSurahs={dueSurahs}
              sessions={state.sessions}
              todaySessions={todaySessions}
              todayCompletedHifz={todayCompletedHifz}
              todayCompletedNearRevision={todayCompletedNearRevision}
              todayCompletedFarRevision={todayCompletedFarRevision}
              onNavigate={setActiveView}
              onQuickLog={handleOpenQuickLog}
            />
          )}

          {activeView === 'wird' && (
            <DailyWirdView
              lang={state.lang}
              nextPlanDayTarget={nextPlanDayTarget}
              dueSurahs={dueSurahs}
              sessions={state.sessions}
              todayCompletedHifz={todayCompletedHifz}
              todayCompletedNearRevision={todayCompletedNearRevision}
              todayCompletedFarRevision={todayCompletedFarRevision}
              onQuickLog={handleOpenQuickLog}
              onOpenCustomModal={handleOpenDefaultLog}
            />
          )}

          {activeView === 'plans' && (
            <PlansView
              lang={state.lang}
              plans={state.plans}
              activePlan={activePlan}
              activeSchedule={activeSchedule}
              onCreatePlan={createPlan}
              onActivatePlan={activatePlan}
              onDeletePlan={deletePlan}
              onReschedulePlan={rescheduleActivePlanFromToday}
            />
          )}

          {activeView === 'revision' && (
            <RevisionView
              lang={state.lang}
              progressMap={state.progressMap}
              memorizedPages={memorizedSummary.memorizedPages}
              manzilCycleDays={state.manzilCycleDays}
              onChangeManzilCycle={setManzilCycleDays}
              onQuickReview={handleOpenQuickLog}
              onDirectRate={handleDirectRateRevision}
            />
          )}

          {activeView === 'map' && (
            <QuranMapView
              lang={state.lang}
              progressMap={state.progressMap}
              onUpdateSurah={updateSurahManualProgress}
            />
          )}

          {activeView === 'reminders' && (
            <RemindersView
              lang={state.lang}
              settings={state.reminderSettings}
              notifications={state.notifications}
              onUpdateSettings={updateReminderSettings}
              onTriggerTest={triggerTestNotification}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}
        </main>
      </div>

      <LogSessionModal
        open={logModalOpen}
        lang={state.lang}
        initialType={modalInitial.type}
        initialSurahId={modalInitial.surahId}
        initialAyahFrom={modalInitial.ayahFrom}
        initialAyahTo={modalInitial.ayahTo}
        onClose={() => setLogModalOpen(false)}
        onSubmit={logSession}
      />
    </div>
  );
}
