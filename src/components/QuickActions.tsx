import React from 'react';
import { Coffee, AlarmClockPlus, RefreshCw } from 'lucide-react';

interface QuickActionsProps {
  onQuickBreak: () => void;
  onSnooze10Min: () => void;
  onCycleSuggestion: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onQuickBreak,
  onSnooze10Min,
  onCycleSuggestion,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <button
        onClick={onQuickBreak}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E8DFF2] text-[#342B43] hover:bg-[#F5EFFC] hover:border-[#B8A1E3] transition-all shadow-2xs active:scale-95 group text-center"
      >
        <div className="w-9 h-9 rounded-xl bg-[#EDE5FA] text-[#8E72C9] group-hover:scale-105 flex items-center justify-center mb-1.5 transition-transform">
          <Coffee className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-[#342B43] leading-snug">یه استراحت کوچولو</span>
        <span className="text-[10px] text-[#81758F] mt-0.5">ثبت آنی</span>
      </button>

      <button
        onClick={onSnooze10Min}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E8DFF2] text-[#342B43] hover:bg-[#F5EFFC] hover:border-[#B8A1E3] transition-all shadow-2xs active:scale-95 group text-center"
      >
        <div className="w-9 h-9 rounded-xl bg-[#F5C6D6]/50 text-[#8E72C9] group-hover:scale-105 flex items-center justify-center mb-1.5 transition-transform">
          <AlarmClockPlus className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-[#342B43] leading-snug">10 دقیقه بعد</span>
        <span className="text-[10px] text-[#81758F] mt-0.5">تمدید تایمر</span>
      </button>

      <button
        onClick={onCycleSuggestion}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E8DFF2] text-[#342B43] hover:bg-[#F5EFFC] hover:border-[#B8A1E3] transition-all shadow-2xs active:scale-95 group text-center"
      >
        <div className="w-9 h-9 rounded-xl bg-[#F6D6B8]/50 text-[#8E72C9] group-hover:scale-105 flex items-center justify-center mb-1.5 transition-transform">
          <RefreshCw className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-[#342B43] leading-snug">یه حرکت دیگه</span>
        <span className="text-[10px] text-[#81758F] mt-0.5">ایده جدید</span>
      </button>
    </div>
  );
};
