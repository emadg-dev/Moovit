import React, { useState } from 'react';
import { Settings, User, LogOut, ChevronDown, UserCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthUser } from '../types';

interface HeaderProps {
  remindersEnabled: boolean;
  user: AuthUser | null;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenSettings,
  onOpenAuth,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FBF8FF]/85 backdrop-blur-md border-b border-[#E8DFF2]/60 px-4 py-3 pt-safe transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
        {/* Brand Zone */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#B8A1E3] to-[#EDE5FA] p-1 flex items-center justify-center shadow-xs">
            <img src="/mascot-idle.svg" alt="تکون بده" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#342B43] tracking-tight leading-none">
              تکون بده
            </h1>
            <p className="text-[11px] text-[#81758F] font-medium mt-0.5">
              یه کم تکون بخور، حالت جا میاد!
            </p>
          </div>
        </div>

        {/* Action Zone */}
        <div className="flex items-center gap-1.5 relative">
          <PWAInstallButton />

          {/* User Account Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white border border-[#E8DFF2] text-xs font-bold text-[#342B43] hover:bg-[#F5EFFC] transition-colors shadow-2xs active:scale-95"
                title="پروفایل کاربر"
              >
                <div className="w-5 h-5 rounded-full bg-[#EDE5FA] text-[#8E72C9] flex items-center justify-center">
                  <UserCheck className="w-3 h-3" />
                </div>
                <span className="max-w-[80px] truncate">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-[#81758F]" />
              </button>

              {showUserMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-2xl bg-white border border-[#E8DFF2] shadow-xl p-2 z-50 text-right animate-in fade-in">
                  <div className="px-3 py-2 border-b border-[#E8DFF2]/60">
                    <p className="text-xs font-bold text-[#342B43] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#81758F] truncate dir-ltr">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#E7A6B0] hover:bg-[#E7A6B0]/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#EDE5FA] text-[#8E72C9] hover:bg-[#8E72C9] hover:text-white transition-colors text-xs font-bold shadow-2xs active:scale-95"
              title="ورود یا ثبت‌نام"
            >
              <User className="w-3.5 h-3.5" />
              <span>ورود</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-2xl bg-white border border-[#E8DFF2] text-[#342B43] flex items-center justify-center hover:bg-[#F5EFFC] transition-colors shadow-2xs active:scale-95"
            aria-label="تنظیمات"
            title="تنظیمات یادآور"
          >
            <Settings className="w-4 h-4 text-[#81758F]" />
          </button>
        </div>
      </div>
    </header>
  );
};
