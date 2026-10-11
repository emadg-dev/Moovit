import { Router, Request, Response } from 'express';
import webPush from 'web-push';
import {
  getUserSettings,
  saveUserSettings,
  upsertPushSubscription,
  removePushSubscription,
  recordCompletedBreak,
  getAllPushSubscriptions,
  createUser,
  authenticateUser,
  getUserById,
  recordDailyActivity,
  calculateStreakForUser
} from './db';
import { getOrCreateVapidKeys } from './scheduler';

export const apiRouter = Router();

// Default fallback user ID for unauthenticated local guest mode
const DEFAULT_USER_ID = 'local-user';

/**
 * Health check & status
 */
apiRouter.get('/status', (_req: Request, res: Response) => {
  const vapid = getOrCreateVapidKeys();
  res.json({
    online: true,
    name: 'تکون بده',
    version: '1.0.0',
    vapidPublicKey: vapid.publicKey,
    subscriptionsCount: getAllPushSubscriptions().length,
  });
});

/**
 * Authentication: Signup
 */
apiRouter.post('/auth/signup', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'نام، ایمیل و رمز عبور الزامی هستند.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  }

  try {
    const user = createUser(name, email, password);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'خطا در ثبت‌نام کاربر.' });
  }
});

/**
 * Authentication: Login
 */
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی هستند.' });
  }

  const user = authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است.' });
  }

  res.json({ success: true, user });
});

/**
 * Authentication: Current user profile
 */
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد.' });
  }

  res.json({ user });
});

/**
 * Streak tracking: Get streak info
 */
apiRouter.get('/user/streak/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId || DEFAULT_USER_ID;
  const streakInfo = calculateStreakForUser(userId);
  res.json({ streakInfo });
});

/**
 * Streak tracking: Record daily activity
 */
apiRouter.post('/user/streak', (req: Request, res: Response) => {
  const { userId, date, breaksCompleted, goalReached } = req.body;
  const targetUser = userId || DEFAULT_USER_ID;
  const targetDate = date || new Date().toISOString().slice(0, 10);

  recordDailyActivity(targetUser, targetDate, breaksCompleted, Boolean(goalReached));
  const updatedStreak = calculateStreakForUser(targetUser);

  res.json({ success: true, streakInfo: updatedStreak });
});

/**
 * Get VAPID public key
 */
apiRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  const vapid = getOrCreateVapidKeys();
  res.json({ publicKey: vapid.publicKey });
});

/**
 * Register push subscription
 */
apiRouter.post('/subscribe', (req: Request, res: Response) => {
  const { subscription, settings } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription endpoint is required.' });
  }

  try {
    upsertPushSubscription(DEFAULT_USER_ID, subscription);

    if (settings) {
      saveUserSettings(DEFAULT_USER_ID, {
        intervalMinutes: settings.intervalMinutes,
        workStart: settings.workStart,
        workEnd: settings.workEnd,
        activeDays: settings.activeDays,
        remindersEnabled: true,
        movementSuggestionsEnabled: settings.movementSuggestionsEnabled,
        timezone: settings.timezone,
      });
    }

    res.json({ success: true, message: 'اشتراک با موفقیت در دیتابیس ثبت شد.' });
  } catch (err: any) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Internal server error saving subscription.' });
  }
});

/**
 * Unsubscribe push
 */
apiRouter.post('/unsubscribe', (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required.' });
  }

  try {
    removePushSubscription(endpoint);
    res.json({ success: true, message: 'اشتراک با موفقیت حذف شد.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * Get user settings
 */
apiRouter.get('/settings', (_req: Request, res: Response) => {
  const settings = getUserSettings(DEFAULT_USER_ID);
  res.json({ settings });
});

/**
 * Update user settings
 */
apiRouter.post('/settings', (req: Request, res: Response) => {
  const { settings } = req.body;
  if (!settings) {
    return res.status(400).json({ error: 'Settings payload required.' });
  }

  try {
    saveUserSettings(DEFAULT_USER_ID, settings);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

/**
 * Record completed break
 */
apiRouter.post('/breaks/complete', (req: Request, res: Response) => {
  const { breakType, completedAt } = req.body;
  try {
    recordCompletedBreak(DEFAULT_USER_ID, breakType || 'desk-movement', completedAt || new Date().toISOString());
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record break in database.' });
  }
});

/**
 * Send an immediate test push to verify notifications on device
 */
apiRouter.post('/test-push', async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  const vapid = getOrCreateVapidKeys();
  webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subs = getAllPushSubscriptions();
  const targetSub = subs.find((s) => s.endpoint === endpoint) || subs[subs.length - 1];

  if (!targetSub) {
    return res.status(404).json({ error: 'هیچ اشتراکی برای ارسال تست یافت نشد.' });
  }

  try {
    const payload = JSON.stringify({
      title: 'تست موفق «تکون بده»! 💜',
      body: 'اعلان با موفقیت از سرور به گوشی شما ارسال شد ✨',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: '/' },
    });

    await webPush.sendNotification(JSON.parse(targetSub.subscriptionJson), payload);
    res.json({ success: true, message: 'اعلان تست ارسال شد!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send test push' });
  }
});
