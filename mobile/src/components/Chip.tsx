import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, spacing, typography, useColors } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tint?: string;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, tint, style }: Props) {
  const colors = useColors();
  const press = useRef(new Animated.Value(0)).current;
  const accent = tint ?? colors.accent;

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        onPressIn={() =>
          Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
        }
        onPressOut={() =>
          Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 20 }).start()
        }
        style={[
          styles.chip,
          {
            borderColor: selected ? accent : colors.border,
            backgroundColor: selected ? colors.accentSoft : colors.surface,
          },
        ]}>
        <Text
          style={[styles.label, { color: selected ? accent : colors.textMuted }]}
          numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    ...typography.caption,
  },
});
