/**
 * Persian language and formatting utilities
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه'
];

/**
 * Converts numbers or inputs to clean English digits (0-9)
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  return input.toString();
}

/**
 * Formats seconds into mm:ss format with English numerals
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  return `${minsStr}:${secsStr}`;
}

/**
 * Formats a Date object or timestamp into HH:mm with English digits
 */
export function formatClockTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Returns a warm, friendly Persian greeting based on the current hour
 */
export function getFriendlyGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return 'صبح قشنگت بخیر! ☀️';
  } else if (hour >= 11 && hour < 14) {
    return 'ظهر بخیر! خسته نباشی 🌿';
  } else if (hour >= 14 && hour < 19) {
    return 'عصر بخیر، یه چای و یه استراحت چطوره؟ ☕';
  } else if (hour >= 19 && hour < 23) {
    return 'شب بخیر! کم‌کم وقت استراحت روزانه‌ست ✨';
  } else {
    return 'نیمه‌شب بخیر! حواست به خواب کافی هم باشه 🌙';
  }
}

/**
 * Returns an encouraging message based on completed breaks today
 */
export function getEncouragementMessage(completed: number, planned: number): string {
  if (completed === 0) {
    return 'هنوز شروع نکردیم؛ اولین تکون رو بزن!';
  }
  if (completed === 1) {
    return 'آفرین! اولین استراحت رو انجام دادی، بدنتم خوشحاله 💜';
  }
  if (completed < planned / 2) {
    return `تا اینجا ${toPersianDigits(completed)} بار به خودت استراحت دادی. دمت گرم!`;
  }
  if (completed < planned) {
    return `بیشتر از نصف راه رو رفتی! (${toPersianDigits(completed)} از ${toPersianDigits(planned)}) ادامه بده 🌸`;
  }
  return `فوق‌العاده‌ای! امروز هوای سلامتیت رو حسابی داشتی (${toPersianDigits(completed)} استراحت کامل) 🌟`;
}

/**
 * Returns the current date in YYYY-MM-DD format based on local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current Persian day index (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
 */
export function getCurrentPersianDayIndex(): number {
  const jsDay = new Date().getDay(); // 0 is Sunday, 6 is Saturday
  // In Persian calendar week starts on Saturday (index 0):
  // Sunday (0) -> 1
  // Monday (1) -> 2
  // Tuesday (2) -> 3
  // Wednesday (3) -> 4
  // Thursday (4) -> 5
  // Friday (5) -> 6
  // Saturday (6) -> 0
  return (jsDay + 1) % 7;
}
