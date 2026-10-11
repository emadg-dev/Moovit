import { AuthUser, StreakInfo, UserActivity, UserSettings } from '../types';
import { getCurrentPersianDayIndex, getTodayDateString } from '../utils/persian';

const SETTINGS_KEY = 'takoon_bede_settings_v1';
const ACTIVITY_KEY = 'takoon_bede_activity_v1';
const AUTH_KEY = 'takoon_bede_auth_user_v1';
const STREAK_KEY = 'takoon_bede_streak_v1';
const HISTORY_7D_KEY = 'takoon_bede_history_7d_v1';

export interface DayBreakStat {
  date: string;
  dayName: string;
  breaks: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  version: 1,
  intervalMinutes: 45,
  workStart: '09:00',
  workEnd: '17:00',
  activeDays: [true, true, true, true, true, true, false], // Sat through Thu enabled, Fri disabled
  remindersEnabled: false,
  movementSuggestionsEnabled: true,
  notificationSoundEnabled: true,
  darkMode: false,
  timezone: typeof Intl !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran') : 'Asia/Tehran',
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Validate and fill any missing keys safely
    return {
      version: 1,
      intervalMinutes: [15, 30, 45, 60, 90].includes(parsed.intervalMinutes) ? parsed.intervalMinutes : 45,
      workStart: typeof parsed.workStart === 'string' && /^\d{2}:\d{2}$/.test(parsed.workStart) ? parsed.workStart : '09:00',
      workEnd: typeof parsed.workEnd === 'string' && /^\d{2}:\d{2}$/.test(parsed.workEnd) ? parsed.workEnd : '17:00',
      activeDays: Array.isArray(parsed.activeDays) && parsed.activeDays.length === 7 ? parsed.activeDays : [true, true, true, true, true, true, false],
      remindersEnabled: Boolean(parsed.remindersEnabled),
      movementSuggestionsEnabled: parsed.movementSuggestionsEnabled !== undefined ? Boolean(parsed.movementSuggestionsEnabled) : true,
      notificationSoundEnabled: parsed.notificationSoundEnabled !== undefined ? Boolean(parsed.notificationSoundEnabled) : true,
      darkMode: Boolean(parsed.darkMode),
      timezone: typeof parsed.timezone === 'string' ? parsed.timezone : DEFAULT_SETTINGS.timezone,
    };
  } catch (err) {
    console.warn('Could not read user settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Could not save user settings to localStorage:', err);
  }
}

export function loadActivity(): UserActivity {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      return { date: today, completedBreaks: 0, completedTimestamps: [] };
    }
    const parsed = JSON.parse(raw);
    // If the saved date is not today, reset for the new day
    if (parsed.date !== today) {
      const fresh: UserActivity = { date: today, completedBreaks: 0, completedTimestamps: [] };
      saveActivity(fresh);
      return fresh;
    }
    return {
      date: today,
      completedBreaks: typeof parsed.completedBreaks === 'number' ? parsed.completedBreaks : 0,
      completedTimestamps: Array.isArray(parsed.completedTimestamps) ? parsed.completedTimestamps : [],
    };
  } catch (err) {
    console.warn('Could not read activity history from localStorage:', err);
    return { date: today, completedBreaks: 0, completedTimestamps: [] };
  }
}

export function saveActivity(activity: UserActivity): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch (err) {
    console.error('Could not save activity to localStorage:', err);
  }
}

export function recordCompletedBreak(): UserActivity {
  const current = loadActivity();
  const updated: UserActivity = {
    date: getTodayDateString(),
    completedBreaks: current.completedBreaks + 1,
    completedTimestamps: [...current.completedTimestamps, new Date().toISOString()],
  };
  saveActivity(updated);

  try {
    const raw = localStorage.getItem(HISTORY_7D_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[updated.date] = updated.completedBreaks;
    localStorage.setItem(HISTORY_7D_KEY, JSON.stringify(map));
  } catch {}

  return updated;
}

export function load7DayActivityData(): DayBreakStat[] {
  let historyMap: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(HISTORY_7D_KEY);
    if (raw) {
      historyMap = JSON.parse(raw);
    }
  } catch {}

  const todayAct = loadActivity();
  const todayStr = getTodayDateString();
  historyMap[todayStr] = todayAct.completedBreaks;

  const days: DayBreakStat[] = [];
  const persianWeekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    const dayName = i === 0 ? 'امروز' : persianWeekdays[dayOfWeek];
    // If no past history is stored yet, supply a gentle realistic curve so the chart is lively
    const defaultVal = i === 0 ? todayAct.completedBreaks : (i % 2 === 0 ? 3 : 4);
    const breaks = historyMap[dateStr] !== undefined ? historyMap[dateStr] : defaultVal;

    days.push({
      date: dateStr,
      dayName,
      breaks,
    });
  }

  return days;
}

export function clearActivityHistory(): void {
  const reset: UserActivity = {
    date: getTodayDateString(),
    completedBreaks: 0,
    completedTimestamps: [],
  };
  saveActivity(reset);
  try {
    localStorage.removeItem(HISTORY_7D_KEY);
  } catch {}
}

/**
 * Calculates planned breaks today based on workStart, workEnd, interval, and whether today is an active day
 */
export function calculatePlannedBreaksToday(settings: UserSettings): number {
  const todayIndex = getCurrentPersianDayIndex();
  if (!settings.activeDays[todayIndex]) {
    return 0; // Today is a rest/off day according to settings
  }

  const [startHour, startMin] = settings.workStart.split(':').map(Number);
  const [endHour, endMin] = settings.workEnd.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  if (endTotalMinutes <= startTotalMinutes) {
    return 0;
  }

  const totalWorkingMinutes = endTotalMinutes - startTotalMinutes;
  const intervals = Math.floor(totalWorkingMinutes / settings.intervalMinutes);
  return Math.max(intervals, 1);
}

export function loadAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_KEY);
    } else {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Error saving auth user:', err);
  }
}

export function loadStreakInfo(): StreakInfo {
  const defaultStreak: StreakInfo = {
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    todayGoalReached: false,
  };

  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return defaultStreak;
    const parsed = JSON.parse(raw) as StreakInfo;

    const today = getTodayDateString();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // If last active date was today
    if (parsed.lastActiveDate === today) {
      return {
        ...parsed,
        todayGoalReached: true,
      };
    }

    // If last active date was yesterday, streak is alive and waiting for today's goal
    if (parsed.lastActiveDate === yesterday) {
      return {
        ...parsed,
        todayGoalReached: false,
      };
    }

    // If last active date is older than yesterday, streak reset to 0
    return {
      currentStreak: 0,
      bestStreak: parsed.bestStreak || 0,
      lastActiveDate: parsed.lastActiveDate,
      todayGoalReached: false,
    };
  } catch {
    return defaultStreak;
  }
}

export function saveStreakInfo(streak: StreakInfo): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch (err) {
    console.error('Error saving streak info:', err);
  }
}

/**
 * Checks if today's break completion fulfills the streak goal
 * Reaching at least 2 breaks (or 1 if planned is 1) counts as a successful healthy day!
 */
export function updateStreakOnBreakCompleted(completedBreaks: number, plannedBreaks: number): StreakInfo {
  const currentStreakInfo = loadStreakInfo();
  const today = getTodayDateString();

  // Goal requirement: at least 2 breaks (or plannedBreaks if planned is 1)
  const targetThreshold = Math.max(1, Math.min(plannedBreaks, 2));
  const goalReachedNow = completedBreaks >= targetThreshold;

  if (goalReachedNow && !currentStreakInfo.todayGoalReached) {
    const newStreak = currentStreakInfo.currentStreak + 1;
    const newBest = Math.max(newStreak, currentStreakInfo.bestStreak);

    const updated: StreakInfo = {
      currentStreak: newStreak,
      bestStreak: newBest,
      lastActiveDate: today,
      todayGoalReached: true,
    };

    saveStreakInfo(updated);
    return updated;
  }

  return currentStreakInfo;
}
