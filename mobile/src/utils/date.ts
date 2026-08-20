const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(value: number) {
  return value < 10 ? '0' + value : String(value);
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return display + ':' + minutes + ' ' + suffix;
}

export function formatDate(date: Date): string {
  return DAY_NAMES[date.getDay()] + ', ' + date.getDate() + ' ' + MONTH_NAMES[date.getMonth()];
}

export function formatDateTime(value: string | Date | null): string {
  if (!value) return 'Not set';

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Not set';

  return formatDate(date) + ' at ' + formatTime(date);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function relativeDay(value: string | Date | null): string {
  if (!value) return 'Someday';

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Someday';

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return formatDate(date);
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function mergeDateAndTime(datePart: Date, timePart: Date): Date {
  const merged = new Date(datePart);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
}

export function roundToNextQuarterHour(date = new Date()): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 15) * 15);
  return rounded;
}
