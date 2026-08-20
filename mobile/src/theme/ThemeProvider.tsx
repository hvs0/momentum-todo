import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName, themes } from './palettes';
import {
  isDaytime,
  MODE_GLYPHS,
  MODE_LABELS,
  nextMode,
  THEME_MODES,
  ThemeMode,
} from '../utils/daylight';

const STORAGE_KEY = 'todo.themeMode.v2';
const LEGACY_KEY = 'todo.theme.v1';

interface ThemeContextValue {
  mode: ThemeMode;
  name: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  label: string;
  glyph: string;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  name: 'light',
  colors: themes.light,
  isDark: false,
  label: MODE_LABELS.auto,
  glyph: MODE_GLYPHS.auto,
  toggle: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [daytime, setDaytime] = useState(() => isDaytime());
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (stored) => {
        if (stored && (THEME_MODES as readonly string[]).includes(stored)) {
          setModeState(stored as ThemeMode);
          return;
        }

        const legacy = await AsyncStorage.getItem(LEGACY_KEY);
        if (legacy === 'light' || legacy === 'dark') setModeState(legacy);
      })
      .catch(() => undefined)
      .finally(() => setRestored(true));
  }, []);

  useEffect(() => {
    if (!restored) return;
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => undefined);
  }, [mode, restored]);

  useEffect(() => {
    if (mode !== 'auto') return;

    setDaytime(isDaytime());
    const timer = setInterval(() => setDaytime(isDaytime()), 60000);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') setDaytime(isDaytime());
    };

    const subscription = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      return nextMode(current);
    });
  }, []);

  const name = useMemo<ThemeName>(() => {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
    return daytime ? 'light' : 'dark';
  }, [daytime, mode, system]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      name,
      colors: themes[name],
      isDark: name === 'dark',
      label: MODE_LABELS[mode],
      glyph: MODE_GLYPHS[mode],
      toggle,
      setMode,
    }),
    [mode, name, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}

export { MODE_LABELS, MODE_GLYPHS, THEME_MODES, isDaytime };
export type { ThemeMode };
