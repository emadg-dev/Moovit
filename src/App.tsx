import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserSettings, UserActivity, TimerStatus, MascotState, AuthUser, StreakInfo } from './types';
import {
  loadSettings,
  saveSettings,
  loadActivity,
  saveActivity,
  recordCompletedBreak,
  clearActivityHistory,
  calculatePlannedBreaksToday,
  loadAuthUser,
  saveAuthUser,
  loadStreakInfo,
  updateStreakOnBreakCompleted,
  load7DayActivityData,
  DayBreakStat,
  DEFAULT_SETTINGS
} from './services/storage';
import { MOVEMENT_SUGGESTIONS } from './data/suggestions';
import { soundManager } from './utils/audio';
import { pushClient } from './services/pushClient';
import { getFriendlyGreeting, toPersianDigits } from './utils/persian';

import { Header } from './components/Header';
import { TimerCard } from './components/TimerCard';
import { ActivityCard } from './components/ActivityCard';
import { QuickActions } from './components/QuickActions';
import { MovementSuggestionCard } from './components/MovementSuggestionCard';
import { SettingsModal } from './components/SettingsModal';
import { CelebrationModal } from './components/CelebrationModal';
import { AuthModal } from './components/AuthModal';
import { BottomDock, ActiveTab } from './components/BottomDock';
import { AccountView } from './components/AccountView';
import { Bell, WifiOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [user, setUser] = useState<AuthUser | null>(loadAuthUser);
  const [streak, setStreak] = useState<StreakInfo>(loadStreakInfo);
  const [history7Days, setHistory7Days] = useState<DayBreakStat[]>(load7DayActivityData);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [activity, setActivity] = useState<UserActivity>(loadActivity);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('stopped');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(settings.intervalMinutes * 60);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [nextBreakTime, setNextBreakTime] = useState<Date | null>(null);

  // Mascot & Suggestion State
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [suggestionIndex, setSuggestionIndex] = useState<number>(0);

  // Sync dark mode class on document element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize service worker on mount
  useEffect(() => {
    pushClient.registerServiceWorker();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to messages posted from the Service Worker (e.g. actions on notifications)
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BREAK_COMPLETED_FROM_NOTIFICATION') {
        handleCompleteBreak();
      } else if (event.data && event.data.type === 'SNOOZE_FROM_NOTIFICATION') {
        handleSnooze10Min();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  // Sync remaining seconds when interval settings change while stopped
  useEffect(() => {
    if (timerStatus === 'stopped') {
      setRemainingSeconds(settings.intervalMinutes * 60);
    }
  }, [settings.intervalMinutes, timerStatus]);

  // Break completion logic
  const handleCompleteBreak = useCallback(() => {
    const updated = recordCompletedBreak();
    setActivity(updated);

    // Update streak based on completed breaks
    const planned = calculatePlannedBreaksToday(settings);
    const updatedStreak = updateStreakOnBreakCompleted(updated.completedBreaks, planned);
    setStreak(updatedStreak);
    setHistory7Days(load7DayActivityData());

    setMascotState('celebrate');
    setIsCelebrationOpen(true);

    if (settings.notificationSoundEnabled) {
      soundManager.playCelebrationChime();
    }

    pushClient.sendBreakCompleted('desk-movement');

    // Sync streak with backend if user is logged in
    if (user) {
      fetch('/api/user/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date: updated.date,
          breaksCompleted: updated.completedBreaks,
          goalReached: updatedStreak.todayGoalReached,
        }),
      }).catch(() => {});
    }

    // Automatically prepare next timer
    const nextIntervalSec = settings.intervalMinutes * 60;
    setRemainingSeconds(nextIntervalSec);
    const target = Date.now() + nextIntervalSec * 1000;
    setTargetEndTime(target);
    setNextBreakTime(new Date(target));
    setTimerStatus('running');
  }, [settings, user]);

  // When timer finishes
  const handleTimerFinish = useCallback(() => {
    if (settings.notificationSoundEnabled) {
      soundManager.playChime();
    }

    // Trigger local push notification
    const messages = [
      'پاشو یه کوچولو راه بریم! 💜 وقت استراحت و کشوقوس رسیده ✨',
      'وقتشه به شونه‌هات یه استراحت بدی 🌷 یه نفس تازه کن!',
      'بیا چند قدم از جات دور شیم! خسته نباشی قهرمان 🌸',
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    pushClient.showLocalNotification('تکون بده! 💜', randomMsg);
    setNotificationBanner(randomMsg);
    setMascotState('stretch');

    // Reset timer to full interval and pause
    setTimerStatus('paused');
    setRemainingSeconds(settings.intervalMinutes * 60);
    setTargetEndTime(null);
  }, [settings.notificationSoundEnabled, settings.intervalMinutes]);

  // Timestamp-based Foreground Timer loop
  useEffect(() => {
    if (timerStatus !== 'running' || !targetEndTime) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.round((targetEndTime - now) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimerFinish();
      }
    };

    // Immediate tick
    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStatus, targetEndTime, handleTimerFinish]);

  // Handle visibilitychange: when app returns from background / iPhone screen lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerStatus === 'running' && targetEndTime) {
        const now = Date.now();
        const diffSec = Math.max(0, Math.round((targetEndTime - now) / 1000));
        setRemainingSeconds(diffSec);
        if (diffSec <= 0) {
          handleTimerFinish();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerStatus, targetEndTime, handleTimerFinish]);

  // Timer controls
  const handleStartTimer = () => {
    const totalSec = remainingSeconds > 0 ? remainingSeconds : settings.intervalMinutes * 60;
    const target = Date.now() + totalSec * 1000;
    setTargetEndTime(target);
    setNextBreakTime(new Date(target));
    setRemainingSeconds(totalSec);
    setTimerStatus('running');
    setMascotState('idle');
    setNotificationBanner(null);

    // Request notification permission smoothly if not yet requested
    if (pushClient.getNotificationPermission() === 'default') {
      pushClient.requestNotificationPermission();
    }
  };

  const handlePauseTimer = () => {
    setTimerStatus('paused');
    setTargetEndTime(null);
    setMascotState('resting');
  };

  const handleResumeTimer = () => {
    const target = Date.now() + remainingSeconds * 1000;
    setTargetEndTime(target);
    setNextBreakTime(new Date(target));
    setTimerStatus('running');
    setMascotState('idle');
  };

  const handleStopTimer = () => {
    setTimerStatus('stopped');
    setTargetEndTime(null);
    setNextBreakTime(null);
    setRemainingSeconds(settings.intervalMinutes * 60);
    setMascotState('sleepy');
  };

  const handleSnooze10Min = () => {
    const extraSec = 10 * 60;
    const newRemaining = remainingSeconds + extraSec;
    setRemainingSeconds(newRemaining);
    if (timerStatus === 'running') {
      const newTarget = Date.now() + newRemaining * 1000;
      setTargetEndTime(newTarget);
      setNextBreakTime(new Date(newTarget));
    }
    setNotificationBanner('10 دقیقه به تایمر اضافه شد! ☕');
    setTimeout(() => setNotificationBanner(null), 4000);
  };

  const handleCycleSuggestion = () => {
    setSuggestionIndex((prev) => (prev + 1) % MOVEMENT_SUGGESTIONS.length);
  };

  const handleMascotClick = () => {
    const states: MascotState[] = ['idle', 'stretch', 'walking', 'celebrate', 'resting'];
    const next = states[(states.indexOf(mascotState) + 1) % states.length];
    setMascotState(next);
  };

  const plannedBreaks = calculatePlannedBreaksToday(settings);
  const currentSuggestion = MOVEMENT_SUGGESTIONS[suggestionIndex];

  return (
    <div className="min-h-screen bg-[#FBF8FF] text-[#342B43] flex flex-col font-sans">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="bg-[#F4D8A5] text-[#342B43] text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 border-b border-[#E8DFF2]">
          <WifiOff className="w-3.5 h-3.5" />
          <span>حالت آفلاین — تایمرها و داده‌ها در دستگاه شما کار می‌کنند.</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        remindersEnabled={settings.remindersEnabled}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          setUser(null);
          saveAuthUser(null);
        }}
      />

      {/* Main Content Area (Mobile Viewport iPhone 15 optimized ~393px-430px) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4 pb-28">
        {/* Friendly greeting */}
        <div className="flex items-center justify-between text-xs text-[#81758F] px-1">
          <span>{user ? `سلام ${user.name}! ${getFriendlyGreeting()}` : getFriendlyGreeting()}</span>
          <span className="font-medium">
            بازه: {toPersianDigits(settings.intervalMinutes)} دقیقه
          </span>
        </div>

        {/* Break Alert Banner */}
        {notificationBanner && (
          <div className="p-3.5 rounded-2xl bg-[#EDE5FA] border border-[#B8A1E3] flex items-center justify-between gap-2 shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8E72C9]">
              <Bell className="w-4 h-4 shrink-0 animate-bounce" />
              <span>{notificationBanner}</span>
            </div>
            <button
              onClick={() => setNotificationBanner(null)}
              className="text-xs font-semibold text-[#81758F] hover:text-[#342B43] px-2 py-0.5 rounded-md"
            >
              بستن
            </button>
          </div>
        )}

        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <>
            {/* Main Timer & Mascot Card */}
            <TimerCard
              status={timerStatus}
              remainingSeconds={remainingSeconds}
              intervalMinutes={settings.intervalMinutes}
              nextBreakTime={nextBreakTime}
              mascotState={mascotState}
              onStart={handleStartTimer}
              onPause={handlePauseTimer}
              onResume={handleResumeTimer}
              onStop={handleStopTimer}
              onTriggerMascotClick={handleMascotClick}
            />

            {/* Quick Action Buttons */}
            <QuickActions
              onQuickBreak={handleCompleteBreak}
              onSnooze10Min={handleSnooze10Min}
              onCycleSuggestion={handleCycleSuggestion}
            />

            {/* Movement Suggestion Card */}
            {settings.movementSuggestionsEnabled && currentSuggestion && (
              <MovementSuggestionCard
                suggestion={currentSuggestion}
                onNextSuggestion={handleCycleSuggestion}
              />
            )}
          </>
        )}

        {/* TAB 2: ACTIVITY */}
        {activeTab === 'activity' && (
          <>
            {/* Today's Activity Card with Streaks & 7-Day Recharts Bar Chart */}
            <ActivityCard
              completedBreaks={activity.completedBreaks}
              plannedBreaks={plannedBreaks}
              streak={streak}
              history7Days={history7Days}
              isDarkMode={settings.darkMode}
              onCompleteBreak={handleCompleteBreak}
            />

            {/* Quick Action Buttons */}
            <QuickActions
              onQuickBreak={handleCompleteBreak}
              onSnooze10Min={handleSnooze10Min}
              onCycleSuggestion={handleCycleSuggestion}
            />
          </>
        )}

        {/* TAB 3: ACCOUNT */}
        {activeTab === 'account' && (
          <AccountView
            user={user}
            streak={streak}
            settings={settings}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={() => {
              setUser(null);
              saveAuthUser(null);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Lower Dock Navigation Bar */}
      <BottomDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
          pushClient.syncSettingsWithBackend(newSettings);
        }}
        onResetDefaults={() => {
          setSettings(DEFAULT_SETTINGS);
          saveSettings(DEFAULT_SETTINGS);
        }}
        onClearHistory={() => {
          clearActivityHistory();
          setActivity(loadActivity());
        }}
      />

      {/* Break Celebration Modal */}
      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => {
          setIsCelebrationOpen(false);
          setMascotState('idle');
        }}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          saveAuthUser(loggedInUser);
          fetch(`/api/user/streak/${loggedInUser.id}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.streakInfo) {
                setStreak(d.streakInfo);
              }
            })
            .catch(() => {});
        }}
      />

      {/* Subtle footer */}
      <footer className="text-center py-5 text-[11px] text-[#81758F] pb-28 mb-safe">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span>«تکون بده»</span>
          <span>·</span>
          <span>هر چند دقیقه، یک قدم برای سلامتی 💜</span>
        </p>
      </footer>
    </div>
  );
}
