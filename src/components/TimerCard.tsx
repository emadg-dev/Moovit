import React from 'react';
import { Mascot } from './Mascot';
import { MascotState, TimerStatus } from '../types';
import { formatClockTime, formatDuration, toPersianDigits } from '../utils/persian';
import { Play, Pause, Square, Sparkles, Clock } from 'lucide-react';

interface TimerCardProps {
  status: TimerStatus;
  remainingSeconds: number;
  intervalMinutes: number;
  nextBreakTime: Date | null;
  mascotState: MascotState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTriggerMascotClick: () => void;
}

export const TimerCard: React.FC<TimerCardProps> = ({
  status,
  remainingSeconds,
  intervalMinutes,
  nextBreakTime,
  mascotState,
  onStart,
  onPause,
  onResume,
  onStop,
  onTriggerMascotClick,
}) => {
  // Compute progress percentage
  const totalSeconds = intervalMinutes * 60;
  const elapsed = totalSeconds - remainingSeconds;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E8DFF2] p-6 shadow-sm">
      {/* Decorative subtle background aura */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#EDE5FA]/60 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[#F5C6D6]/30 blur-2xl pointer-events-none" />

      {/* Mascot Hero Area */}
      <div className="relative flex flex-col items-center text-center">
        <Mascot
          state={mascotState}
          size={140}
          onClick={onTriggerMascotClick}
          className="mb-2"
        />

        {/* State headline */}
        {status === 'stopped' && (
          <p className="text-sm font-semibold text-[#81758F] mb-1">
            خب، آماده‌ای یه کم بیشتر هوای خودت رو داشته باشیم؟
          </p>
        )}
        {status === 'running' && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8E72C9] mb-1 bg-[#EDE5FA] px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>حواسم به استراحتت هست، با خیال راحت کار کن</span>
          </div>
        )}
        {status === 'paused' && (
          <p className="text-sm font-semibold text-[#81758F] mb-1">
            فعلاً متوقف شدیم؛ هر وقت خواستی برگردیم سر کار!
          </p>
        )}

        {/* Large Timer Countdown */}
        <div className="my-2">
          <div className="text-5xl font-extrabold tracking-tight text-[#342B43] tabular-nums font-mono drop-shadow-xs">
            {formatDuration(remainingSeconds)}
          </div>
          <p className="text-xs text-[#81758F] mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>بازه استراحت: هر {toPersianDigits(intervalMinutes)} دقیقه</span>
            {status === 'running' && nextBreakTime && (
              <>
                <span>·</span>
                <span>استراحت بعدی ساعت {formatClockTime(nextBreakTime)}</span>
              </>
            )}
          </p>
        </div>

        {/* Circular or Linear Progress Bar */}
        {status !== 'stopped' && (
          <div className="w-full bg-[#F5EFFC] h-2.5 rounded-full overflow-hidden my-3 border border-[#E8DFF2]">
            <div
              className="bg-gradient-to-l from-[#8E72C9] to-[#B8A1E3] h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Primary Action Button Bar */}
        <div className="w-full mt-4 flex items-center gap-2">
          {status === 'stopped' && (
            <button
              onClick={onStart}
              className="w-full min-h-[52px] rounded-2xl bg-[#8E72C9] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-[#8E72C9]/20 hover:bg-[#7D61B8] active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>بزن بریم!</span>
            </button>
          )}

          {status === 'running' && (
            <>
              <button
                onClick={onPause}
                className="flex-1 min-h-[52px] rounded-2xl bg-[#EDE5FA] text-[#8E72C9] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#E2D5F8] active:scale-[0.98] transition-all"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>مکث کوتاه</span>
              </button>

              <button
                onClick={onStop}
                className="flex-1 min-h-[52px] rounded-2xl bg-white border border-[#E8DFF2] text-[#81758F] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#F5EFFC] hover:text-[#E7A6B0] active:scale-[0.98] transition-all"
              >
                <Square className="w-4 h-4" />
                <span>فعلاً بیخیال</span>
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                onClick={onResume}
                className="flex-1 min-h-[52px] rounded-2xl bg-[#8E72C9] text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#7D61B8] shadow-md shadow-[#8E72C9]/20 active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ادامه بدیم؟</span>
              </button>

              <button
                onClick={onStop}
                className="flex-1 min-h-[52px] rounded-2xl bg-white border border-[#E8DFF2] text-[#81758F] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#F5EFFC] active:scale-[0.98] transition-all"
              >
                <Square className="w-4 h-4" />
                <span>پایان یادآوری</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
