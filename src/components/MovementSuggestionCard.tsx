import React from 'react';
import { MovementSuggestion } from '../types';
import { Mascot } from './Mascot';
import { Sparkles, ArrowLeft, Heart } from 'lucide-react';

interface MovementSuggestionCardProps {
  suggestion: MovementSuggestion;
  onNextSuggestion: () => void;
}

export const MovementSuggestionCard: React.FC<MovementSuggestionCardProps> = ({
  suggestion,
  onNextSuggestion,
}) => {
  return (
    <div className="rounded-3xl bg-white border border-[#E8DFF2] p-5 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F6D6B8]/40 text-[#8E72C9] flex items-center justify-center">
            <Heart className="w-4 h-4 fill-current text-[#8E72C9]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#342B43]">پیشنهاد تحرک برای الان</h2>
            <p className="text-[11px] text-[#81758F]">یه حرکت ساده و لذت‌بخش</p>
          </div>
        </div>

        <button
          onClick={onNextSuggestion}
          className="flex items-center gap-1 text-xs font-semibold text-[#8E72C9] hover:text-[#7D61B8] bg-[#EDE5FA] px-2.5 py-1 rounded-full transition-colors active:scale-95"
          title="مشاهده حرکت بعدی"
        >
          <span>حرکت بعدی</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Suggestion Body with Mascot */}
      <div className="flex items-center gap-4 bg-[#FBF8FF] p-4 rounded-2xl border border-[#E8DFF2]/70">
        <div className="shrink-0">
          <Mascot
            state={suggestion.mascotPose}
            size={76}
            interactive={true}
          />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#342B43] mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#8E72C9]" />
            <span>{suggestion.title}</span>
          </h3>
          <p className="text-xs text-[#342B43] leading-relaxed mb-2">
            {suggestion.description}
          </p>
          <p className="text-[11px] font-medium text-[#81758F] bg-white px-2 py-0.5 rounded-md inline-block border border-[#E8DFF2]">
            فایده: {suggestion.benefit}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-[#81758F]/80 text-center mt-2.5">
        حرکات پیشنهادی برای رفع خستگی پشت میز است و جنبه تجویز درمانی ندارد.
      </p>
    </div>
  );
};
