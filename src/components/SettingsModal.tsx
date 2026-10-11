import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { PERSIAN_WEEKDAYS, toPersianDigits } from '../utils/persian';
import { pushClient } from '../services/pushClient';
import {
  X,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  RotateCcw,
  Trash2,
  Check,
  Wifi,
  WifiOff,
  Radio,
  Moon,
  Sun
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onSave: (newSettings: UserSettings) => void;
  onResetDefaults: () => void;
  onClearHistory: () => void;
}

const INTERVAL_OPTIONS = [15, 30, 45, 60, 90];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onResetDefaults,
  onClearHistory,
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [saveToast, setSaveToast] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Push status
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(settings);
      setSaveToast(false);
      setConfirmReset(false);
      setConfirmClear(false);
      setPushStatusMessage(null);

      // Check current push and server status
      pushClient.checkBackendStatus().then((status) => {
        setBackendOnline(status.online);
      });
      pushClient.getExistingSubscription().then((sub) => {
        setIsPushSubscribed(!!sub);
      });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    onClose();
  };

  const handleToggleDay = (index: number) => {
    const updated = [...form.activeDays];
    updated[index] = !updated[index];
    setForm({ ...form, activeDays: updated });
  };

  const handleSave = () => {
    onSave(form);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 700);
  };

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    setPushStatusMessage(null);
    try {
      if (isPushSubscribed) {
        const res = await pushClient.unsubscribeFromWebPush();
        setIsPushSubscribed(false);
        setPushStatusMessage(res.message);
      } else {
        const res = await pushClient.subscribeToWebPush(form);
        setIsPushSubscribed(res.success);
        setPushStatusMessage(res.message);
      }
    } catch {
      setPushStatusMessage('خطایی در ارتباط با سرور رخ داد.');
    } finally {
      setIsPushLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#E8DFF2] my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DFF2]/80 bg-[#FBF8FF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EDE5FA] text-[#8E72C9] flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-bold text-[#342B43]">تنظیمات «تکون بده»</h2>
              <p className="text-[11px] text-[#81758F]">سفارشی‌سازی یادآورها و برنامه کاری</p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="p-1.5 rounded-full text-[#81758F] hover:bg-[#F5EFFC] transition-colors"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-right">
          {/* Interval Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#342B43] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#8E72C9]" />
              <span>هر چند دقیقه یه تکونی بخوریم؟</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {INTERVAL_OPTIONS.map((mins) => {
                const isSelected = form.intervalMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setForm({ ...form, intervalMinutes: mins })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#8E72C9] text-white border-[#8E72C9] shadow-xs scale-102'
                        : 'bg-[#FBF8FF] text-[#342B43] border-[#E8DFF2] hover:bg-[#F5EFFC]'
                    }`}
                  >
                    {toPersianDigits(mins)} دقیقه
                  </button>
                );
              })}
            </div>
          </div>

          {/* Work Hours */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#342B43] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#8E72C9]" />
              <span>ساعت کاری روزانه</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
                <span className="text-[11px] font-medium text-[#81758F] block mb-1">
                  از چه ساعتی شروع کنیم؟
                </span>
                <input
                  type="time"
                  value={form.workStart}
                  onChange={(e) => setForm({ ...form, workStart: e.target.value })}
                  className="w-full bg-white border border-[#E8DFF2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#342B43] focus:outline-none focus:border-[#8E72C9]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
                <span className="text-[11px] font-medium text-[#81758F] block mb-1">
                  تا چه ساعتی یادآوری کنم؟
                </span>
                <input
                  type="time"
                  value={form.workEnd}
                  onChange={(e) => setForm({ ...form, workEnd: e.target.value })}
                  className="w-full bg-white border border-[#E8DFF2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#342B43] focus:outline-none focus:border-[#8E72C9]"
                />
              </div>
            </div>
          </div>

          {/* Active Days */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#342B43] flex items-center gap-1.5">
              <span>کی‌ها سر کار هستی؟ (روزهای فعال)</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PERSIAN_WEEKDAYS.map((dayName, idx) => {
                const isActive = form.activeDays[idx];
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => handleToggleDay(idx)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-[#EDE5FA] text-[#8E72C9] border-[#B8A1E3]'
                        : 'bg-[#FBF8FF] text-[#81758F]/60 border-[#E8DFF2]'
                    }`}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1 border-t border-[#E8DFF2]/60">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
              <div className="flex items-center gap-2">
                {form.notificationSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#8E72C9]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#81758F]" />
                )}
                <div>
                  <span className="text-xs font-bold text-[#342B43] block">صدای زنگ یادآور</span>
                  <span className="text-[10px] text-[#81758F]">چایم ملایم پاستلی هنگام پایان زمان</span>
                </div>
              </div>
              <button
                type="button"
                dir="ltr"
                onClick={() => setForm({ ...form, notificationSoundEnabled: !form.notificationSoundEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  form.notificationSoundEnabled ? 'bg-[#8E72C9]' : 'bg-[#E8DFF2]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    form.notificationSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Movement suggestions toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8E72C9]" />
                <div>
                  <span className="text-xs font-bold text-[#342B43] block">پیشنهاد حرکت‌ها رو نشونم بده</span>
                  <span className="text-[10px] text-[#81758F]">ایده‌های کشش و رفع خستگی در داشبورد</span>
                </div>
              </div>
              <button
                type="button"
                dir="ltr"
                onClick={() => setForm({ ...form, movementSuggestionsEnabled: !form.movementSuggestionsEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  form.movementSuggestionsEnabled ? 'bg-[#8E72C9]' : 'bg-[#E8DFF2]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    form.movementSuggestionsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Dark Mode Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
              <div className="flex items-center gap-2">
                {form.darkMode ? (
                  <Moon className="w-4 h-4 text-[#A78BFA]" />
                ) : (
                  <Sun className="w-4 h-4 text-[#F6D6B8]" />
                )}
                <div>
                  <span className="text-xs font-bold text-[#342B43] block">حالت شب (تم بنفش تیره)</span>
                  <span className="text-[10px] text-[#81758F]">رنگ‌های آرامش‌بخش برای کار در شب و کاهش خستگی چشم</span>
                </div>
              </div>
              <button
                type="button"
                dir="ltr"
                onClick={() => {
                  const nextVal = !form.darkMode;
                  setForm({ ...form, darkMode: nextVal });
                  if (nextVal) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  form.darkMode ? 'bg-[#8E72C9]' : 'bg-[#E8DFF2]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    form.darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Web Push Background Reminders */}
          <div className="p-4 rounded-2xl bg-[#F5EFFC]/80 border border-[#B8A1E3]/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#8E72C9]" />
                <span className="text-xs font-bold text-[#342B43]">اعلان‌های پس‌زمینه (Web Push)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                {backendOnline === true ? (
                  <span className="text-[#8E72C9] flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> سرور متصل است
                  </span>
                ) : (
                  <span className="text-[#81758F] flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> حالت محلی (آفلاین)
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#81758F] leading-relaxed">
              با فعال‌سازی این بخش، حتی زمانی که تب مرورگر یا برنامه بسته باشد، یادآوری‌ها از طریق سرور برایتان ارسال می‌شوند.
            </p>

            <button
              type="button"
              disabled={isPushLoading}
              onClick={handleTogglePush}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isPushSubscribed
                  ? 'bg-white border border-[#E7A6B0] text-[#E7A6B0] hover:bg-[#E7A6B0]/10'
                  : 'bg-[#8E72C9] text-white hover:bg-[#7D61B8]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>
                {isPushLoading
                  ? 'در حال پردازش...'
                  : isPushSubscribed
                  ? 'لغو اشتراک اعلان‌های پس‌زمینه'
                  : 'فعال‌سازی اعلان‌های پس‌زمینه 🔔'}
              </span>
            </button>

            {pushStatusMessage && (
              <p className="text-[11px] font-semibold text-[#8E72C9] bg-white p-2 rounded-xl text-center border border-[#E8DFF2]">
                {pushStatusMessage}
              </p>
            )}
          </div>

          {/* Danger zone / Data Management */}
          <div className="space-y-2 pt-2 border-t border-[#E8DFF2]">
            <div className="flex items-center gap-2">
              {confirmReset ? (
                <div className="flex-1 flex items-center gap-1 bg-[#F5EFFC] p-2 rounded-xl">
                  <span className="text-[11px] font-medium text-[#342B43]">مطمئنی؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaults();
                      setConfirmReset(false);
                      document.documentElement.classList.remove('dark');
                      onClose();
                    }}
                    className="px-2 py-1 bg-[#8E72C9] text-white text-[10px] font-bold rounded-lg"
                  >
                    بله، بازنشانی کن
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-1 bg-white text-[#81758F] text-[10px] font-bold rounded-lg border border-[#E8DFF2]"
                  >
                    انصراف
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FBF8FF] border border-[#E8DFF2] text-[#81758F] hover:text-[#342B43] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>برگردیم به تنظیمات اول؟</span>
                </button>
              )}

              {confirmClear ? (
                <div className="flex-1 flex items-center gap-1 bg-[#F5EFFC] p-2 rounded-xl">
                  <span className="text-[11px] font-medium text-[#342B43]">پاک بشه؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-2 py-1 bg-[#E7A6B0] text-white text-[10px] font-bold rounded-lg"
                  >
                    بله، پاک کن
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 bg-white text-[#81758F] text-[10px] font-bold rounded-lg border border-[#E8DFF2]"
                  >
                    انصراف
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FBF8FF] border border-[#E8DFF2] text-[#81758F] hover:text-[#E7A6B0] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاک کردن سابقه</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E8DFF2]/80 bg-[#FBF8FF] flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[46px] rounded-2xl bg-[#8E72C9] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#7D61B8] shadow-md shadow-[#8E72C9]/20 active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{saveToast ? 'اوکی شد، ذخیره‌اش کردم!' : 'ذخیره کن'}</span>
          </button>

          <button
            type="button"
            onClick={handleCloseModal}
            className="min-h-[46px] px-5 rounded-2xl bg-white border border-[#E8DFF2] text-[#81758F] font-bold text-sm hover:bg-[#F5EFFC] transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
