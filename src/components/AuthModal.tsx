import React, { useState } from 'react';
import { AuthUser } from '../types';
import { X, UserPlus, LogIn, Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('لطفاً نام خود را وارد کنید.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('ایمیل و رمز عبور الزامی هستند.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = mode === 'signup'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در ارتباط با سرور.');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      // If server is offline / unreachable, fallback to creating local offline profile seamlessly!
      if (err.message && err.message.includes('Failed to fetch')) {
        const offlineUser: AuthUser = {
          id: 'local_' + Date.now(),
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(offlineUser);
        onClose();
      } else {
        setErrorMessage(err.message || 'مشکلی رخ داد، لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#E8DFF2] my-auto relative text-right">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DFF2]/70">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#81758F] hover:bg-[#F5EFFC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#342B43]">
              {mode === 'signup' ? 'ثبت‌نام در «تکون بده»' : 'ورود به حساب کاربری'}
            </h3>
            <div className="w-7 h-7 rounded-xl bg-[#EDE5FA] text-[#8E72C9] flex items-center justify-center">
              {mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#FBF8FF] rounded-2xl border border-[#E8DFF2] mb-4">
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#8E72C9] shadow-xs'
                : 'text-[#81758F] hover:text-[#342B43]'
            }`}
          >
            ثبت‌نام جدید
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-[#8E72C9] shadow-xs'
                : 'text-[#81758F] hover:text-[#342B43]'
            }`}
          >
            ورود
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-[#E7A6B0]/15 border border-[#E7A6B0]/40 text-[#342B43] text-xs font-medium flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-[#E7A6B0] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#342B43] mb-1">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثلاً: علی رضایی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FBF8FF] border border-[#E8DFF2] rounded-2xl px-3.5 py-2.5 text-xs text-[#342B43] focus:outline-none focus:border-[#8E72C9] pr-9"
                />
                <User className="w-4 h-4 text-[#81758F] absolute right-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#342B43] mb-1">
              آدرس ایمیل
            </label>
            <div className="relative">
              <input
                type="email"
                required
                dir="ltr"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FBF8FF] border border-[#E8DFF2] rounded-2xl px-3.5 py-2.5 text-xs text-[#342B43] focus:outline-none focus:border-[#8E72C9] pr-9 font-sans"
              />
              <Mail className="w-4 h-4 text-[#81758F] absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#342B43] mb-1">
              رمز عبور (حداقل ۶ کاراکتر)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FBF8FF] border border-[#E8DFF2] rounded-2xl px-3.5 py-2.5 text-xs text-[#342B43] focus:outline-none focus:border-[#8E72C9] pr-9 font-sans"
              />
              <Lock className="w-4 h-4 text-[#81758F] absolute right-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[46px] rounded-2xl bg-[#8E72C9] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#7D61B8] shadow-md shadow-[#8E72C9]/20 active:scale-[0.98] transition-all mt-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isLoading
                ? 'در حال پردازش...'
                : mode === 'signup'
                ? 'ایجاد حساب کاربری ✨'
                : 'ورود به حساب'}
            </span>
          </button>
        </form>

        <p className="text-[11px] text-[#81758F] text-center mt-4">
          با ساخت حساب، سابقه استراحت‌ها و زنجیره روزهای شما ذخیره می‌شود.
        </p>
      </div>
    </div>
  );
};
