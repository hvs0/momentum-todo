export const THEME_MODES = ['auto', 'system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const DAY_STARTS_HOUR = 6;
export const NIGHT_STARTS_HOUR = 18;

export const MODE_LABELS: Record<ThemeMode, string> = {
  auto: 'Auto by time',
  system: 'System default',
  light: 'Light',
  dark: 'Dark',
};

export const MODE_GLYPHS: Record<ThemeMode, string> = {
  auto: '◐',
  system: '⚙',
  light: '☀',
  dark: '☾',
};

export function isDaytime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= DAY_STARTS_HOUR && hour < NIGHT_STARTS_HOUR;
}

export function nextMode(mode: ThemeMode): ThemeMode {
  return THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
}
