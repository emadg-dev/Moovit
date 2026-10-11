import { UserSettings } from '../types';

/**
 * Utility to convert base64 URL-safe string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushClientService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initializes Service Worker registration
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }

  /**
   * Checks current browser notification permission
   */
  public getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Requests browser notification permission explicitly
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Displays an immediate in-app or browser notification
   */
  public async showLocalNotification(title: string, body: string, icon = '/icon.svg'): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          body,
          icon,
          badge: '/icon.svg',
          tag: 'takoon-bede-reminder',
        });
        return true;
      } else {
        new Notification(title, {
          body,
          icon,
        });
        return true;
      }
    } catch (err) {
      console.warn('Error triggering local notification:', err);
      return false;
    }
  }

  /**
   * Checks if the optional backend server is available
   */
  public async checkBackendStatus(): Promise<{ online: boolean; vapidPublicKey?: string }> {
    try {
      const res = await fetch('/api/status', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return { online: false };
      const data = await res.json();
      return { online: true, vapidPublicKey: data.vapidPublicKey };
    } catch {
      return { online: false };
    }
  }

  /**
   * Retrieves current active PushSubscription if any
   */
  public async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    try {
      const reg = this.swRegistration || (await navigator.serviceWorker.ready);
      return await reg.pushManager.getSubscription();
    } catch (err) {
      console.warn('Could not inspect push subscription:', err);
      return null;
    }
  }

  /**
   * Subscribes browser to Web Push using server VAPID key
   */
  public async subscribeToWebPush(settings: UserSettings): Promise<{ success: boolean; message: string }> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return {
        success: false,
        message: 'مرورگر شما از اعلان‌های وب‌پوش در پس‌زمینه پشتیبانی نمی‌کنه.',
      };
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'اجازه اعلان‌ها داده نشد. برای فعال‌سازی باید در تنظیمات مرورگر اجازه بدی.',
      };
    }

    try {
      const reg = this.swRegistration || (await navigator.serviceWorker.ready);

      // Check backend status and fetch public key
      const status = await this.checkBackendStatus();
      if (!status.online || !status.vapidPublicKey) {
        return {
          success: false,
          message: 'سرور اعلان پس‌زمینه در دسترس نیست، اما تایمر و اعلان‌های داخل برنامه فعالند! 🌸',
        };
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(status.vapidPublicKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Send subscription and user schedule to backend
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Server responded with ' + response.status);
      }

      return {
        success: true,
        message: 'اعلان‌های پس‌زمینه با موفقیت فعال شدند! 💜',
      };
    } catch (err) {
      console.error('Subscription to Web Push failed:', err);
      return {
        success: false,
        message: 'مشکلی در اتصال به سرور اعلان پیش اومد. نگران نباش، تایمر برنامه کار می‌کنه.',
      };
    }
  }

  /**
   * Unsubscribes from Web Push
   */
  public async unsubscribeFromWebPush(): Promise<{ success: boolean; message: string }> {
    try {
      const reg = this.swRegistration || (await navigator.serviceWorker.ready);
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        // Notify backend
        fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});

        await subscription.unsubscribe();
      }
      return {
        success: true,
        message: 'اعلان‌های پس‌زمینه غیرفعال شدند.',
      };
    } catch (err) {
      console.warn('Unsubscribe error:', err);
      return {
        success: false,
        message: 'خطا در لغو اشتراک اعلان.',
      };
    }
  }

  /**
   * Syncs user settings with backend
   */
  public async syncSettingsWithBackend(settings: UserSettings): Promise<boolean> {
    try {
      const sub = await this.getExistingSubscription();
      if (!sub) return false;

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          settings,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sends break completion event to backend
   */
  public async sendBreakCompleted(breakType: string): Promise<boolean> {
    try {
      const res = await fetch('/api/breaks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakType,
          completedAt: new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const pushClient = new PushClientService();
