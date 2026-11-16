import React, { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { DailyWirdView } from './components/DailyWirdView';
import { DashboardView } from './components/DashboardView';
import { DataBackupModal } from './components/DataBackupModal';
import { GuidedTourOverlay } from './components/GuidedTourOverlay';
import { GuideView } from './components/GuideView';
import { LogSessionModal } from './components/LogSessionModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { PlansView } from './components/PlansView';
import { QuranMapView } from './components/QuranMapView';
import { RemindersView } from './components/RemindersView';
import { RevisionView } from './components/RevisionView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SURAH_MAP } from './data/quranData';
import { useQuranStore } from './hooks/useQuranStore';
import { ActiveView, OnboardingSetupPayload, QualityRating, SessionType } from './types/quran';
import { getTodayISO } from './utils/plannerEngine';
import { usePwaStatus } from './utils/pwaManager';

const TOUR_VIEW_SEQUENCE: ActiveView[] = ['dashboard', 'wird', 'revision', 'map', 'guide'];

export default function App() {
  const {
    state,
    storagePersisted,
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
    startFreshEmpty,
    skipOnboardingToDemo,
    completeOnboardingSetup,
    dismissDemoBanner,
    deleteSession,
    exportBackupJSON,
    importBackupJSON,
  } = useQuranStore();

  const { isOnline, isOfflineReady, canInstall, installApp } = usePwaStatus();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);

  const isFirstTimeWizard = state.onboardingCompleted === false;
  const wizardVisible = isFirstTimeWizard || setupWizardOpen;

  const startGuidedTour = () => {
    setActiveView(TOUR_VIEW_SEQUENCE[0]);
    setTourStep(0);
  };

  const handleTourNext = () => {
    if (tourStep === null) return;
    const next = tourStep + 1;
    if (next >= TOUR_VIEW_SEQUENCE.length) {
      setTourStep(null);
      return;
    }
    setTourStep(next);
    setActiveView(TOUR_VIEW_SEQUENCE[next]);
  };

  const handleTourPrev = () => {
    if (tourStep === null || tourStep <= 0) return;
    const prev = tourStep - 1;
    setTourStep(prev);
    setActiveView(TOUR_VIEW_SEQUENCE[prev]);
  };

  const handleCompleteOnboarding = (payload: OnboardingSetupPayload, startTour: boolean) => {
    completeOnboardingSetup(payload);
    setSetupWizardOpen(false);
    if (startTour) {
      startGuidedTour();
    } else {
      setActiveView('dashboard');
    }
  };
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        lang={state.lang}
        theme={state.theme}
        activeView={activeView}
        unreadCount={unreadCount}
        mobileOpen={mobileMenuOpen}
        isOnline={isOnline}
        isOfflineReady={isOfflineReady}
        canInstall={canInstall}
        onInstallApp={installApp}
        onOpenBackupModal={() => setBackupModalOpen(true)}
        onOpenSetupWizard={() => setSetupWizardOpen(true)}
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
          isOnline={isOnline}
          canInstall={canInstall}
          onInstallApp={installApp}
          onOpenGuide={() => setActiveView('guide')}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleLang={() => setLang(state.lang === 'ar' ? 'en' : 'ar')}
          onOpenLogModal={handleOpenDefaultLog}
          onMarkNotificationRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
          onNavigateReminders={() => setActiveView('reminders')}
        />

        <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {activeView === 'dashboard' && (
            <DashboardView
              lang={state.lang}
              isDemoMode={state.isDemoMode}
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
              onStartFresh={startFreshEmpty}
              onDismissDemo={dismissDemoBanner}
              onOpenBackupModal={() => setBackupModalOpen(true)}
              onOpenSetupWizard={() => setSetupWizardOpen(true)}
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
              onDeleteSession={deleteSession}
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

          {activeView === 'guide' && (
            <GuideView
              lang={state.lang}
              isOnline={isOnline}
              isOfflineReady={isOfflineReady}
              storagePersisted={storagePersisted}
              onNavigate={setActiveView}
              onStartTour={startGuidedTour}
              onOpenSetupWizard={() => setSetupWizardOpen(true)}
              onOpenBackupModal={() => setBackupModalOpen(true)}
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

      <DataBackupModal
        open={backupModalOpen}
        lang={state.lang}
        isOnline={isOnline}
        isOfflineReady={isOfflineReady}
        storagePersisted={storagePersisted}
        canInstall={canInstall}
        onInstallApp={installApp}
        onClose={() => setBackupModalOpen(false)}
        onExport={exportBackupJSON}
        onImport={importBackupJSON}
        onStartFresh={startFreshEmpty}
        onResetDemo={resetDemoData}
      />

      {wizardVisible && (
        <OnboardingWizardModal
          open={wizardVisible}
          lang={state.lang}
          theme={state.theme}
          initialProgressMap={state.progressMap}
          initialManzilDays={state.manzilCycleDays}
          isFirstTime={isFirstTimeWizard}
          onToggleLang={() => setLang(state.lang === 'ar' ? 'en' : 'ar')}
          onToggleTheme={toggleTheme}
          onCompleteSetup={handleCompleteOnboarding}
          onSkipToDemo={skipOnboardingToDemo}
          onClose={() => setSetupWizardOpen(false)}
        />
      )}

      <GuidedTourOverlay
        active={tourStep !== null && !wizardVisible}
        stepIndex={tourStep ?? 0}
        lang={state.lang}
        onNext={handleTourNext}
        onPrev={handleTourPrev}
        onClose={() => setTourStep(null)}
        onOpenWizard={() => setSetupWizardOpen(true)}
      />

      <BottomNav
        lang={state.lang}
        activeView={activeView}
        onSelectView={setActiveView}
      />
    </div>
  );
}
