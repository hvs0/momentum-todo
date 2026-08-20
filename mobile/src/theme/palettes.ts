export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textFaint: string;

  accent: string;
  accentSoft: string;
  accentContrast: string;

  success: string;
  warning: string;
  danger: string;

  priority: {
    low: string;
    medium: string;
    high: string;
    urgent: string;
  };

  scrim: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EEE6',
  border: '#E7E0D6',
  borderStrong: '#D6CCBE',

  text: '#1C1917',
  textMuted: '#78716C',
  textFaint: '#A8A29E',

  accent: '#C2410C',
  accentSoft: '#FBEAE0',
  accentContrast: '#FFFFFF',

  success: '#0F766E',
  warning: '#B45309',
  danger: '#B91C1C',

  priority: {
    low: '#0F766E',
    medium: '#1D4ED8',
    high: '#B45309',
    urgent: '#B91C1C',
  },

  scrim: 'rgba(28, 25, 23, 0.45)',
  skeleton: '#EDE6DC',
};

export const darkColors: ThemeColors = {
  background: '#1A1614',
  surface: '#232019',
  surfaceAlt: '#2C271F',
  border: '#3A342C',
  borderStrong: '#4A4238',

  text: '#F5F0E8',
  textMuted: '#B0A79C',
  textFaint: '#857B70',

  accent: '#E8734A',
  accentSoft: '#3A251C',
  accentContrast: '#1A1614',

  success: '#3FA795',
  warning: '#D99A3E',
  danger: '#E5645C',

  priority: {
    low: '#3FA795',
    medium: '#6E9BF0',
    high: '#D99A3E',
    urgent: '#E5645C',
  },

  scrim: 'rgba(0, 0, 0, 0.55)',
  skeleton: '#2E2921',
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
