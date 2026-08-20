import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName, themes } from './palettes';

const STORAGE_KEY = 'todo.theme.v1';

interface ThemeContextValue {
  name: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  toggle: () => void;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  name: 'light',
  colors: themes.light,
  isDark: false,
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [name, setName] = useState<ThemeName>(system === 'dark' ? 'dark' : 'light');
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') setName(stored);
      })
      .catch(() => undefined)
      .finally(() => setRestored(true));
  }, []);

  useEffect(() => {
    if (!restored) return;
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => undefined);
  }, [name, restored]);

  const setTheme = useCallback((next: ThemeName) => setName(next), []);
  const toggle = useCallback(() => setName((current) => (current === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      name,
      colors: themes[name],
      isDark: name === 'dark',
      toggle,
      setTheme,
    }),
    [name, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}
