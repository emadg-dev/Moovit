/**
 * Type definitions for «تکون بده» (Takoon Bede)
 */

export type MascotState = 'idle' | 'stretch' | 'walking' | 'sleepy' | 'celebrate' | 'resting';

export type TimerStatus = 'stopped' | 'running' | 'paused';

export interface UserSettings {
  version: number;
  intervalMinutes: number; // 15, 30, 45, 60, 90
  workStart: string; // HH:mm e.g. "09:00"
  workEnd: string; // HH:mm e.g. "17:00"
  activeDays: boolean[]; // 7 days: Saturday (index 0) to Friday (index 6)
  remindersEnabled: boolean;
  movementSuggestionsEnabled: boolean;
  notificationSoundEnabled: boolean;
  darkMode: boolean;
  timezone: string;
}

export interface UserActivity {
  date: string; // YYYY-MM-DD
  completedBreaks: number;
  completedTimestamps: string[];
}

export interface MovementSuggestion {
  id: string;
  title: string;
  description: string;
  mascotPose: MascotState;
  benefit: string;
}

export interface PushBackendStatus {
  isConfigured: boolean;
  isSubscribed: boolean;
  endpointUrl: string;
  lastSyncAt: string | null;
  serverOnline: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  todayGoalReached: boolean;
}

