import React from 'react';
import { getEncouragementMessage, toPersianDigits } from '../utils/persian';
import { Award, CheckCircle2, Flame, Trophy, BarChart3 } from 'lucide-react';
import { StreakInfo } from '../types';
import { DayBreakStat } from '../services/storage';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface ActivityCardProps {
  completedBreaks: number;
  plannedBreaks: number;
  streak: StreakInfo;
  history7Days: DayBreakStat[];
  isDarkMode?: boolean;
  onCompleteBreak: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  completedBreaks,
  plannedBreaks,
  streak,
  history7Days,
  isDarkMode = false,
  onCompleteBreak,
}) => {
  const progressPercent = plannedBreaks > 0
    ? Math.min(100, Math.round((completedBreaks / plannedBreaks) * 100))
    : (completedBreaks > 0 ? 100 : 0);

  const encouragement = getEncouragementMessage(completedBreaks, plannedBreaks);

  // Target threshold for daily streak goal: 2 breaks (or planned breaks if 1)
  const streakThreshold = Math.max(1, Math.min(plannedBreaks, 2));
  const remainingForStreak = Math.max(0, streakThreshold - completedBreaks);

  // Calculate 7-day total and daily average
  const total7DayBreaks = history7Days.reduce((sum, item) => sum + item.breaks, 0);
  const averageDailyBreaks = (total7DayBreaks / Math.max(1, history7Days.length)).toFixed(1);

  return (
    <div className="rounded-3xl bg-white border border-[#E8DFF2] p-5 shadow-xs space-y-4">
      {/* Top Header Row with Title and Streaks */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EDE5FA] text-[#8E72C9] flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#342B43]">فعالیت امروز من</h2>
            <p className="text-[11px] text-[#81758F]">ثبت استراحت‌های موفق روز</p>
          </div>
        </div>

        {/* Streaks Badge with Small Flame Icon */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            streak.currentStreak > 0
              ? 'bg-[#F6D6B8]/40 border-[#F6D6B8] text-[#342B43]'
              : 'bg-[#FBF8FF] border-[#E8DFF2] text-[#81758F]'
          }`}
          title={`زنجیره روزهای متوالی: ${toPersianDigits(streak.currentStreak)} روز (رکورد: ${toPersianDigits(streak.bestStreak)} روز)`}
        >
          <Flame
            className={`w-3.5 h-3.5 ${
              streak.currentStreak > 0
                ? 'text-amber-500 fill-amber-500 animate-pulse'
                : 'text-[#81758F]'
            }`}
          />
          <span>{toPersianDigits(streak.currentStreak)} روز متوالی</span>
        </div>
      </div>

      {/* Counter and Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-[#342B43] mb-1.5">
          <span className="text-[#81758F]">میزان پیشرفت روز</span>
          <div className="flex items-baseline gap-1 bg-[#F5EFFC] px-2.5 py-0.5 rounded-full border border-[#E8DFF2]">
            <span className="text-[#8E72C9]">{toPersianDigits(completedBreaks)}</span>
            <span className="text-[#81758F]">از</span>
            <span>{toPersianDigits(plannedBreaks)} استراحت</span>
          </div>
        </div>

        <div className="w-full bg-[#F5EFFC] h-3 rounded-full overflow-hidden p-0.5 border border-[#E8DFF2]">
          <div
            className="bg-gradient-to-l from-[#8E72C9] via-[#B8A1E3] to-[#B9DDCA] h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Streaks Status Banner */}
      <div className="p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]/80 space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-[#342B43]">
              {streak.todayGoalReached
                ? `هدف امروز ثبت شد! زنجیره به ${toPersianDigits(streak.currentStreak)} روز رسید 🔥`
                : streak.currentStreak > 0
                ? `برای حفظ زنجیره، ${toPersianDigits(remainingForStreak)} استراحت دیگه امروز لازمه!`
                : `با ${toPersianDigits(streakThreshold)} استراحت امروز، اولین زنجیره روزانه رو شروع کن!`}
            </span>
          </div>

          {streak.bestStreak > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-[#81758F] shrink-0">
              <Trophy className="w-3 h-3 text-[#F6D6B8]" />
              <span>رکورد: {toPersianDigits(streak.bestStreak)} روز</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-[#81758F] pr-5 leading-relaxed">
          {encouragement}
        </p>
      </div>

      {/* 7-Day Activity Recharts Bar Chart */}
      <div className="pt-2 border-t border-[#E8DFF2]/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#8E72C9]" />
            <h3 className="text-xs font-bold text-[#342B43]">استراحت‌های 7 روز گذشته</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#81758F]">
            <span>مجموع: <strong>{toPersianDigits(total7DayBreaks)}</strong></span>
            <span>·</span>
            <span>میانگین: <strong>{toPersianDigits(averageDailyBreaks)}</strong></span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="w-full h-44 bg-[#FBF8FF] rounded-2xl p-2 border border-[#E8DFF2]/60 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={history7Days}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <XAxis
                dataKey="dayName"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: isDarkMode ? '#B4A7CC' : '#81758F', fontFamily: 'IRANSans, sans-serif' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: isDarkMode ? '#B4A7CC' : '#81758F', fontFamily: 'IRANSans, sans-serif' }}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? 'rgba(167, 139, 250, 0.15)' : 'rgba(237, 229, 250, 0.4)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayBreakStat;
                    return (
                      <div className={`px-2.5 py-1.5 rounded-xl shadow-md border text-right text-xs ${
                        isDarkMode
                          ? 'bg-[#1C152B] border-[#382C52] text-[#F8F5FF]'
                          : 'bg-white border-[#E8DFF2] text-[#342B43]'
                      }`}>
                        <p className="font-bold">{data.dayName}</p>
                        <p className={`font-medium mt-0.5 ${isDarkMode ? 'text-[#C4B0F2]' : 'text-[#8E72C9]'}`}>
                          {toPersianDigits(data.breaks)} استراحت ثبت‌شده
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="breaks"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              >
                {history7Days.map((entry, index) => {
                  const isToday = index === history7Days.length - 1;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        isDarkMode
                          ? isToday ? '#A78BFA' : '#5B4380'
                          : isToday ? '#8E72C9' : '#B8A1E3'
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Direct Completion CTA Button */}
      <button
        onClick={onCompleteBreak}
        className="w-full min-h-[46px] rounded-2xl bg-[#EDE5FA] text-[#8E72C9] hover:bg-[#8E72C9] hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>همین الان استراحت کردم (ثبت استراحت) 🌟</span>
      </button>
    </div>
  );
};
