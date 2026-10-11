import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

const DB_FILE_PATH = path.resolve('takoon-bede.sqlite');

let dbInstance: Database | null = null;

/**
 * Persists the in-memory SQLite database state to disk
 */
function saveDbToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err);
  }
}

/**
 * Initializes SQLite database and schema
 */
export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[DB] Loaded existing SQLite database from ${DB_FILE_PATH}`);
    } catch (err) {
      console.warn('[DB] Could not read existing DB file, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log(`[DB] Created new SQLite database at ${DB_FILE_PATH}`);
  }

  // Enforce foreign keys and create schemas
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Table 1: user_settings
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      interval_minutes INTEGER NOT NULL DEFAULT 45,
      work_start TEXT NOT NULL DEFAULT '09:00',
      work_end TEXT NOT NULL DEFAULT '17:00',
      active_days_json TEXT NOT NULL DEFAULT '[true,true,true,true,true,true,false]',
      reminders_enabled INTEGER NOT NULL DEFAULT 1,
      movement_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
      timezone TEXT NOT NULL DEFAULT 'Asia/Tehran',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Table 2: push_subscriptions
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      subscription_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_success_at TEXT,
      last_error_at TEXT
    );
  `);

  // Table 3: completed_breaks
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS completed_breaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      scheduled_at TEXT,
      completed_at TEXT NOT NULL,
      break_type TEXT NOT NULL DEFAULT 'desk-movement',
      created_at TEXT NOT NULL
    );
  `);

  // Table 4: notification_deliveries
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      status TEXT NOT NULL,
      deduplication_key TEXT NOT NULL UNIQUE,
      error_code TEXT
    );
  `);

  // Table 5: users (accounts system)
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Table 6: daily_streaks
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS daily_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      breaks_completed INTEGER NOT NULL DEFAULT 0,
      goal_reached INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date)
    );
  `);

  // Indexes for high performance
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_subs_user ON push_subscriptions (user_id);`);
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_breaks_user ON completed_breaks (user_id);`);
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_deliveries_key ON notification_deliveries (deduplication_key);`);
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`);
  dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_streaks_user_date ON daily_streaks (user_id, date);`);

  saveDbToDisk();
  return dbInstance;
}

export interface UserSettingsRow {
  userId: string;
  intervalMinutes: number;
  workStart: string;
  workEnd: string;
  activeDays: boolean[];
  remindersEnabled: boolean;
  movementSuggestionsEnabled: boolean;
  timezone: string;
}

export function getUserSettings(userId: string): UserSettingsRow | null {
  if (!dbInstance) return null;
  const stmt = dbInstance.prepare('SELECT * FROM user_settings WHERE user_id = :userId LIMIT 1');
  stmt.bind({ ':userId': userId });
  if (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    stmt.free();
    let activeDays = [true, true, true, true, true, true, false];
    try {
      activeDays = JSON.parse(row.active_days_json as string);
    } catch {}

    return {
      userId: row.user_id as string,
      intervalMinutes: Number(row.interval_minutes),
      workStart: row.work_start as string,
      workEnd: row.work_end as string,
      activeDays,
      remindersEnabled: Boolean(row.reminders_enabled),
      movementSuggestionsEnabled: Boolean(row.movement_suggestions_enabled),
      timezone: row.timezone as string,
    };
  }
  stmt.free();
  return null;
}

export function saveUserSettings(userId: string, settings: Partial<UserSettingsRow>): void {
  if (!dbInstance) return;
  const now = new Date().toISOString();
  const existing = getUserSettings(userId);

  const interval = settings.intervalMinutes ?? (existing?.intervalMinutes || 45);
  const workStart = settings.workStart ?? (existing?.workStart || '09:00');
  const workEnd = settings.workEnd ?? (existing?.workEnd || '17:00');
  const activeDaysJson = JSON.stringify(settings.activeDays ?? (existing?.activeDays || [true, true, true, true, true, true, false]));
  const remindersEnabled = settings.remindersEnabled !== undefined ? (settings.remindersEnabled ? 1 : 0) : (existing?.remindersEnabled ? 1 : 0);
  const suggestionsEnabled = settings.movementSuggestionsEnabled !== undefined ? (settings.movementSuggestionsEnabled ? 1 : 0) : 1;
  const timezone = settings.timezone ?? (existing?.timezone || 'Asia/Tehran');

  if (existing) {
    dbInstance.run(
      `UPDATE user_settings SET
        interval_minutes = :interval,
        work_start = :workStart,
        work_end = :workEnd,
        active_days_json = :activeDaysJson,
        reminders_enabled = :remindersEnabled,
        movement_suggestions_enabled = :suggestionsEnabled,
        timezone = :timezone,
        updated_at = :now
      WHERE user_id = :userId`,
      {
        ':interval': interval,
        ':workStart': workStart,
        ':workEnd': workEnd,
        ':activeDaysJson': activeDaysJson,
        ':remindersEnabled': remindersEnabled,
        ':suggestionsEnabled': suggestionsEnabled,
        ':timezone': timezone,
        ':now': now,
        ':userId': userId,
      }
    );
  } else {
    dbInstance.run(
      `INSERT INTO user_settings (
        user_id, interval_minutes, work_start, work_end, active_days_json,
        reminders_enabled, movement_suggestions_enabled, timezone, created_at, updated_at
      ) VALUES (
        :userId, :interval, :workStart, :workEnd, :activeDaysJson,
        :remindersEnabled, :suggestionsEnabled, :timezone, :now, :now
      )`,
      {
        ':userId': userId,
        ':interval': interval,
        ':workStart': workStart,
        ':workEnd': workEnd,
        ':activeDaysJson': activeDaysJson,
        ':remindersEnabled': remindersEnabled,
        ':suggestionsEnabled': suggestionsEnabled,
        ':timezone': timezone,
        ':now': now,
      }
    );
  }
  saveDbToDisk();
}

export function upsertPushSubscription(userId: string, subscription: Record<string, unknown>): void {
  if (!dbInstance) return;
  const now = new Date().toISOString();
  const endpoint = subscription.endpoint as string;
  const jsonStr = JSON.stringify(subscription);

  dbInstance.run(
    `INSERT INTO push_subscriptions (user_id, endpoint, subscription_json, created_at, updated_at)
     VALUES (:userId, :endpoint, :jsonStr, :now, :now)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = :userId,
       subscription_json = :jsonStr,
       updated_at = :now`,
    {
      ':userId': userId,
      ':endpoint': endpoint,
      ':jsonStr': jsonStr,
      ':now': now,
    }
  );
  saveDbToDisk();
}

export function removePushSubscription(endpoint: string): void {
  if (!dbInstance) return;
  dbInstance.run(`DELETE FROM push_subscriptions WHERE endpoint = :endpoint`, {
    ':endpoint': endpoint,
  });
  saveDbToDisk();
}

export function getAllPushSubscriptions(): Array<{ id: number; userId: string; endpoint: string; subscriptionJson: string }> {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare('SELECT id, user_id, endpoint, subscription_json FROM push_subscriptions');
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    results.push({
      id: Number(row.id),
      userId: row.user_id as string,
      endpoint: row.endpoint as string,
      subscriptionJson: row.subscription_json as string,
    });
  }
  stmt.free();
  return results;
}

export function hasNotificationBeenDelivered(deduplicationKey: string): boolean {
  if (!dbInstance) return false;
  const stmt = dbInstance.prepare('SELECT id FROM notification_deliveries WHERE deduplication_key = :key LIMIT 1');
  stmt.bind({ ':key': deduplicationKey });
  const exists = stmt.step();
  stmt.free();
  return exists;
}

export function recordNotificationDelivery(
  userId: string,
  scheduledAt: string,
  deduplicationKey: string,
  status: string,
  errorCode?: string
): void {
  if (!dbInstance) return;
  const now = new Date().toISOString();
  try {
    dbInstance.run(
      `INSERT INTO notification_deliveries (
        user_id, scheduled_at, sent_at, status, deduplication_key, error_code
      ) VALUES (
        :userId, :scheduledAt, :now, :status, :deduplicationKey, :errorCode
      )`,
      {
        ':userId': userId,
        ':scheduledAt': scheduledAt,
        ':now': now,
        ':status': status,
        ':deduplicationKey': deduplicationKey,
        ':errorCode': errorCode || null,
      }
    );
    saveDbToDisk();
  } catch (err) {
    // Duplicate delivery key ignored safely
    console.warn('[DB] Deduplication prevented duplicate delivery record:', deduplicationKey);
  }
}

export function recordCompletedBreak(userId: string, breakType: string, completedAt: string): void {
  if (!dbInstance) return;
  const now = new Date().toISOString();
  dbInstance.run(
    `INSERT INTO completed_breaks (user_id, break_type, completed_at, created_at)
     VALUES (:userId, :breakType, :completedAt, :now)`,
    {
      ':userId': userId,
      ':breakType': breakType,
      ':completedAt': completedAt,
      ':now': now,
    }
  );
  saveDbToDisk();
}

import crypto from 'crypto';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function createUser(name: string, email: string, password: string): UserProfile {
  if (!dbInstance) throw new Error('Database not initialized');
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if exists
  const checkStmt = dbInstance.prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
  checkStmt.bind({ ':email': normalizedEmail });
  if (checkStmt.step()) {
    checkStmt.free();
    throw new Error('این ایمیل قبلاً ثبت‌نام شده است.');
  }
  checkStmt.free();

  const userId = 'usr_' + crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  dbInstance.run(
    `INSERT INTO users (id, name, email, password_hash, salt, created_at, updated_at)
     VALUES (:id, :name, :email, :hash, :salt, :now, :now)`,
    {
      ':id': userId,
      ':name': name.trim(),
      ':email': normalizedEmail,
      ':hash': passwordHash,
      ':salt': salt,
      ':now': now,
    }
  );

  saveDbToDisk();
  return { id: userId, name: name.trim(), email: normalizedEmail, createdAt: now };
}

export function authenticateUser(email: string, password: string): UserProfile | null {
  if (!dbInstance) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const stmt = dbInstance.prepare('SELECT id, name, email, password_hash, salt, created_at FROM users WHERE email = :email LIMIT 1');
  stmt.bind({ ':email': normalizedEmail });

  if (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    stmt.free();
    const salt = row.salt as string;
    const expectedHash = row.password_hash as string;
    const computedHash = hashPassword(password, salt);

    if (computedHash === expectedHash) {
      return {
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        createdAt: row.created_at as string,
      };
    }
  } else {
    stmt.free();
  }

  return null;
}

export function getUserById(id: string): UserProfile | null {
  if (!dbInstance) return null;
  const stmt = dbInstance.prepare('SELECT id, name, email, created_at FROM users WHERE id = :id LIMIT 1');
  stmt.bind({ ':id': id });
  if (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    stmt.free();
    return {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      createdAt: row.created_at as string,
    };
  }
  stmt.free();
  return null;
}

export interface UserStreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  todayGoalReached: boolean;
}

export function recordDailyActivity(
  userId: string,
  date: string,
  breaksCompleted: number,
  goalReached: boolean
): void {
  if (!dbInstance) return;
  const now = new Date().toISOString();

  dbInstance.run(
    `INSERT INTO daily_streaks (user_id, date, breaks_completed, goal_reached, created_at, updated_at)
     VALUES (:userId, :date, :breaks, :reached, :now, :now)
     ON CONFLICT(user_id, date) DO UPDATE SET
       breaks_completed = :breaks,
       goal_reached = :reached,
       updated_at = :now`,
    {
      ':userId': userId,
      ':date': date,
      ':breaks': breaksCompleted,
      ':reached': goalReached ? 1 : 0,
      ':now': now,
    }
  );

  saveDbToDisk();
}

export function calculateStreakForUser(userId: string): UserStreakInfo {
  if (!dbInstance) {
    return { currentStreak: 0, bestStreak: 0, lastActiveDate: null, todayGoalReached: false };
  }

  const stmt = dbInstance.prepare(
    `SELECT date, goal_reached FROM daily_streaks
     WHERE user_id = :userId AND goal_reached = 1
     ORDER BY date DESC`
  );
  stmt.bind({ ':userId': userId });

  const reachedDates: string[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    reachedDates.push(row.date as string);
  }
  stmt.free();

  if (reachedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastActiveDate: null, todayGoalReached: false };
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayGoalReached = reachedDates.includes(today);
  const lastActiveDate = reachedDates[0];

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();
  if (!todayGoalReached) {
    // If today hasn't been reached yet, check from yesterday
    checkDate = new Date(Date.now() - 86400000);
  }

  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (reachedDates.includes(dateStr)) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  // Calculate best all-time streak
  let bestStreak = currentStreak;
  let running = 0;
  // Sort ascending for best streak calculation
  const sorted = [...reachedDates].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = new Date(sorted[i - 1]).getTime();
      const curr = new Date(sorted[i]).getTime();
      const diffDays = Math.round((curr - prev) / 86400000);
      if (diffDays === 1) {
        running++;
      } else {
        running = 1;
      }
    }
    if (running > bestStreak) {
      bestStreak = running;
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastActiveDate,
    todayGoalReached,
  };
}
