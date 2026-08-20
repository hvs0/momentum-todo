import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';

export function ThemeToggle() {
  const { colors, isDark, toggle } = useTheme();
  const spin = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(spin, {
      toValue: isDark ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isDark, spin]);

  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Animated.View
        style={{
          transform: [
            {
              rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
            },
          ],
        }}>
        <Text style={[styles.glyph, { color: colors.accent }]}>{isDark ? '☾' : '☀'}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing(0.25),
  },
  glyph: {
    ...typography.body,
    fontSize: 16,
  },
});
