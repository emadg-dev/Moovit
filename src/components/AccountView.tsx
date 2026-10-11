import React from 'react';
import { AuthUser, StreakInfo, UserSettings } from '../types';
import { Mascot } from './Mascot';
import { toPersianDigits } from '../utils/persian';
import {
  User,
  Mail,
  Flame,
  Trophy,
  Settings,
  LogOut,
  LogIn,
  ShieldCheck,
  Calendar,
  Clock
} from 'lucide-react';

interface AccountViewProps {
  user: AuthUser | null;
  streak: StreakInfo;
  settings: UserSettings;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  streak,
  settings,
  onOpenAuth,
  onLogout,
  onOpenSettings,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in pb-4">
      {/* User Identity Profile Card */}
      <div className="rounded-3xl bg-white border border-[#E8DFF2] p-5 shadow-xs text-center relative overflow-hidden">
        {/* Soft background aura */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#EDE5FA]/60 blur-xl pointer-events-none" />

        <div className="relative flex flex-col items-center">
          <Mascot
            state={user ? 'celebrate' : 'idle'}
            size={96}
            className="mb-2"
          />

          {user ? (
            <>
              <h2 className="text-base font-extrabold text-[#342B43]">{user.name}</h2>
              <p className="text-xs text-[#81758F] dir-ltr mt-0.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#8E72C9]" />
                <span>{user.email}</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E7A6B0]/15 text-[#E7A6B0] hover:bg-[#E7A6B0]/25 transition-colors active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-base font-extrabold text-[#342B43]">کاربر مهمان</h2>
              <p className="text-xs text-[#81758F] mt-1 max-w-xs mx-auto leading-relaxed">
                در حال حاضر در حالت مهمان هستید. برای ذخیره دائمی و همگام‌سازی ابری، وارد شوید یا ثبت‌نام کنید.
              </p>
              <button
                onClick={onOpenAuth}
                className="mt-3.5 px-5 py-2.5 rounded-2xl bg-[#8E72C9] text-white text-xs font-bold hover:bg-[#7D61B8] shadow-md shadow-[#8E72C9]/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود یا ثبت‌نام حساب 💜</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Streaks & Health Achievements Card */}
      <div className="rounded-3xl bg-white border border-[#E8DFF2] p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-[#81758F] uppercase tracking-wider">
          دستاوردها و زنجیره استراحت
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2] text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-[#F6D6B8]/40 text-amber-500 flex items-center justify-center mx-auto">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <span className="text-xl font-extrabold text-[#342B43] block">
              {toPersianDigits(streak.currentStreak)} روز
            </span>
            <span className="text-[11px] text-[#81758F]">زنجیره فعلی</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2] text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-[#EDE5FA] text-[#8E72C9] flex items-center justify-center mx-auto">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xl font-extrabold text-[#342B43] block">
              {toPersianDigits(streak.bestStreak)} روز
            </span>
            <span className="text-[11px] text-[#81758F]">بیشترین رکورد</span>
          </div>
        </div>
      </div>

      {/* Routine & Preferences Summary Card */}
      <div className="rounded-3xl bg-white border border-[#E8DFF2] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#81758F] uppercase tracking-wider">
            برنامه کاری و یادآوری
          </h3>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-xs font-bold text-[#8E72C9] hover:text-[#7D61B8]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>ویرایش</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF8FF] border border-[#E8DFF2]">
            <span className="text-[#81758F] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8E72C9]" />
              <span>فاصله استراحت‌ها</span>
            </span>
            <span className="font-bold text-[#342B43]">
              هر {toPersianDigits(settings.intervalMinutes)} دقیقه
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF8FF] border border-[#E8DFF2]">
            <span className="text-[#81758F] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8E72C9]" />
              <span>ساعت کاری روزانه</span>
            </span>
            <span className="font-bold text-[#342B43]">
              {settings.workStart} تا {settings.workEnd}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="p-4 rounded-2xl bg-[#F5EFFC] border border-[#E8DFF2] flex items-start gap-2.5 text-right">
        <ShieldCheck className="w-4 h-4 text-[#8E72C9] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#81758F] leading-relaxed">
          تمامی داده‌های سلامتی شما در دستگاه خودتان ذخیره می‌شود و هیچ اطلاعاتی برای اهداف تبلیغاتی استفاده نخواهد شد.
        </p>
      </div>
    </div>
  );
};
