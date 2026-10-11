import React from 'react';
import { Mascot } from './Mascot';
import { Sparkles, Check } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#E8DFF2] text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-[#EDE5FA] blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-[#F5C6D6]/40 blur-xl pointer-events-none" />

        <div className="relative">
          <Mascot
            state="celebrate"
            size={130}
            className="mx-auto mb-3"
            interactive={true}
          />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B9DDCA]/30 text-[#342B43] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#8E72C9]" />
            <span>دمت گرم! عالی بود</span>
          </div>

          <h3 className="text-lg font-extrabold text-[#342B43] mb-2">
            یک استراحت سالم ثبت شد! 💜
          </h3>

          <p className="text-xs text-[#81758F] leading-relaxed mb-5">
            همین چند دقیقه قدم زدن یا کشوقوس، انرژی و سلامتی بدنت رو دوچندان می‌کنه. خسته نباشی قهرمان!
          </p>

          <button
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-[#8E72C9] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#8E72C9]/20 hover:bg-[#7D61B8] active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4" />
            <span>بزن بریم ادامه بدیم!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
