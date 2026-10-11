import fs from 'fs';
import path from 'path';
import webPush from 'web-push';
import {
  getAllPushSubscriptions,
  getUserSettings,
  hasNotificationBeenDelivered,
  recordNotificationDelivery,
  removePushSubscription
} from './db';

const VAPID_CACHE_FILE = path.resolve('.vapid.json');

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/**
 * Loads existing VAPID keys or creates a fresh development pair
 */
export function getOrCreateVapidKeys(): VapidKeys {
  const envPublic = process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@takoon-bede.local';

  if (envPublic && envPrivate) {
    return {
      publicKey: envPublic,
      privateKey: envPrivate,
      subject,
    };
  }

  if (fs.existsSync(VAPID_CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VAPID_CACHE_FILE, 'utf-8'));
      if (data.publicKey && data.privateKey) {
        return {
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          subject: data.subject || subject,
        };
      }
    } catch {}
  }

  // Generate new keys
  const keys = webPush.generateVAPIDKeys();
  const vapid: VapidKeys = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    subject,
  };

  try {
    fs.writeFileSync(VAPID_CACHE_FILE, JSON.stringify(vapid, null, 2));
    console.log('[Scheduler] Generated and saved new VAPID keys to .vapid.json');
  } catch (err) {
    console.warn('[Scheduler] Could not write .vapid.json:', err);
  }

  return vapid;
}

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Rotates friendly Persian push messages
 */
function getRandomReminderMessage(): { title: string; body: string } {
  const messages = [
    { title: 'تکون بده! 💜', body: 'پاشو یه کوچولو راه بریم! وقت کشوقوس و یه استراحت باحاله ✨' },
    { title: 'وقت استراحته! 🌷', body: 'به شونه‌هات یه کشش بده و یه نفس عمیق بکش 🌸' },
    { title: 'یه لیوان آب چطوره؟ 💧', body: 'پاشو چند قدم راه برو و یه لیوان آب خنک بنوش 🌿' },
    { title: 'استراحت چشم‌ها ✨', body: 'چند ثانیه از مانیتور فاصله بگیر و به دوردست نگاه کن 💜' },
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Checks all active subscriptions against user schedule and sends due push reminders
 */
export async function runSchedulerTick() {
  const subscriptions = getAllPushSubscriptions();
  if (subscriptions.length === 0) return;

  const vapid = getOrCreateVapidKeys();
  webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  for (const subItem of subscriptions) {
    try {
      const settings = getUserSettings(subItem.userId);
      if (!settings || !settings.remindersEnabled) {
        continue;
      }

      // Check user's current date and time in their timezone
      const userTz = settings.timezone || 'Asia/Tehran';
      const now = new Date();

      // Format time into HH:mm in user's timezone
      const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: userTz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTz,
        weekday: 'short',
      });

      const currentTimeStr = timeFormatter.format(now); // "14:30"
      const currentDateStr = dateFormatter.format(now); // "2026-10-11"
      const currentWeekdayStr = weekdayFormatter.format(now); // "Sat", "Sun", etc.

      // Map weekday to Persian index (0: Sat, 1: Sun, ..., 6: Fri)
      const dayMap: Record<string, number> = {
        Sat: 0,
        Sun: 1,
        Mon: 2,
        Tue: 3,
        Wed: 4,
        Thu: 5,
        Fri: 6,
      };
      const persianDayIndex = dayMap[currentWeekdayStr] ?? 0;

      // Check if active on this weekday
      if (!settings.activeDays[persianDayIndex]) {
        continue;
      }

      // Check if within work hours
      const [curH, curM] = currentTimeStr.split(':').map(Number);
      const [startH, startM] = settings.workStart.split(':').map(Number);
      const [endH, endM] = settings.workEnd.split(':').map(Number);

      const curTotalM = curH * 60 + curM;
      const startTotalM = startH * 60 + startM;
      const endTotalM = endH * 60 + endM;

      if (curTotalM < startTotalM || curTotalM > endTotalM) {
        continue;
      }

      // Check if an interval boundary matches current time (within 1 min)
      const minutesSinceStart = curTotalM - startTotalM;
      if (minutesSinceStart <= 0) continue;

      const interval = settings.intervalMinutes;
      const slotIndex = Math.floor(minutesSinceStart / interval);
      const slotTargetMinute = startTotalM + slotIndex * interval;

      // Check if we are at this slot minute
      if (Math.abs(curTotalM - slotTargetMinute) <= 1 && slotIndex > 0) {
        const deduplicationKey = `user_${subItem.userId}_${currentDateStr}_slot_${slotIndex}`;

        if (!hasNotificationBeenDelivered(deduplicationKey)) {
          console.log(`[Scheduler] Delivering push notification for user ${subItem.userId} (slot ${slotIndex})`);

          const msg = getRandomReminderMessage();
          const payload = JSON.stringify({
            title: msg.title,
            body: msg.body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            data: { url: '/' },
          });

          const pushSubscription = JSON.parse(subItem.subscriptionJson);

          try {
            await webPush.sendNotification(pushSubscription, payload);
            recordNotificationDelivery(subItem.userId, new Date().toISOString(), deduplicationKey, 'SENT');
          } catch (err: any) {
            console.error(`[Scheduler] Failed to push to endpoint:`, err?.statusCode || err);
            recordNotificationDelivery(subItem.userId, new Date().toISOString(), deduplicationKey, 'FAILED', err?.message);

            // Clean up expired or unregistered subscriptions
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              console.log(`[Scheduler] Subscription expired or unsubscribed (status ${err.statusCode}). Removing from DB.`);
              removePushSubscription(subItem.endpoint);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Scheduler] Error processing subscription:', err);
    }
  }
}

/**
 * Starts the background push scheduler service
 */
export function startScheduler(intervalMs = 60000) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }
  console.log('[Scheduler] Background push scheduler started (interval: 60s)');
  // Run first check after 5 seconds, then every 60s
  setTimeout(runSchedulerTick, 5000);
  schedulerTimer = setInterval(runSchedulerTick, intervalMs);
}

export function stopScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
