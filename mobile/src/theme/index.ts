import { Platform, TextStyle } from 'react-native';

export * from './palettes';
export { ThemeProvider, useTheme, useColors } from './ThemeProvider';

const serif = Platform.select({ android: 'serif', default: 'Georgia' });
const sans = Platform.select({ android: 'sans-serif', default: 'System' });
const sansMedium = Platform.select({ android: 'sans-serif-medium', default: 'System' });

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const typography = {
  display: {
    fontFamily: serif,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.5,
  } as TextStyle,
  title: {
    fontFamily: serif,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.2,
  } as TextStyle,
  heading: {
    fontFamily: sansMedium,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  body: {
    fontFamily: sans,
    fontSize: 15,
    lineHeight: 21,
  } as TextStyle,
  caption: {
    fontFamily: sans,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
  micro: {
    fontFamily: sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
  } as TextStyle,
};

export function elevation(level: 'card' | 'float', isDark: boolean) {
  if (Platform.OS === 'android') {
    return { elevation: level === 'card' ? 1 : 5 };
  }

  return {
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.4 : level === 'card' ? 0.06 : 0.14,
    shadowRadius: level === 'card' ? 6 : 16,
    shadowOffset: { width: 0, height: level === 'card' ? 2 : 8 },
  };
}
