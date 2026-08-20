import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { elevation, radius, spacing, typography, useTheme } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: Props) {
  const { colors, isDark } = useTheme();
  const press = useRef(new Animated.Value(0)).current;
  const inactive = disabled || loading;

  const pressIn = () =>
    Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 45, bounciness: 0 }).start();

  const pressOut = () =>
    Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.975] });

  const surface =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surface;
  const labelColor =
    variant === 'ghost' ? colors.textMuted : variant === 'danger' ? '#FFFFFF' : colors.accentContrast;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={inactive}
        style={[
          styles.button,
          variant !== 'ghost' && elevation('card', isDark),
          {
            backgroundColor: surface,
            borderColor: variant === 'ghost' ? colors.border : surface,
          },
          inactive && styles.faded,
        ]}>
        {loading ? <ActivityIndicator color={labelColor} size="small" /> : null}
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
  },
  label: {
    ...typography.heading,
  },
  faded: {
    opacity: 0.5,
  },
});
