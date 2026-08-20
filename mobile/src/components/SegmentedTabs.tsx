import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useColors } from '../theme';

export interface TabOption<T extends string> {
  key: T;
  label: string;
  badge?: number;
}

interface Props<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  const colors = useColors();
  const [trackWidth, setTrackWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;

  const index = Math.max(
    0,
    options.findIndex((option) => option.key === value),
  );
  const segment = trackWidth > 0 ? trackWidth / options.length : 0;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: index,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [index, slide]);

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width - 8);
  };

  return (
    <View
      style={[styles.track, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      onLayout={onLayout}>
      {segment > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segment,
              backgroundColor: colors.surface,
              borderColor: colors.borderStrong,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, segment],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}

      {options.map((option) => {
        const active = option.key === value;

        return (
          <Pressable key={option.key} onPress={() => onChange(option.key)} style={styles.tab}>
            <Text
              style={[
                styles.label,
                { color: active ? colors.text : colors.textMuted },
                active && styles.labelActive,
              ]}>
              {option.label}
            </Text>

            {option.badge !== undefined ? (
              <Text style={[styles.badge, { color: active ? colors.accent : colors.textFaint }]}>
                {option.badge}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(2.5),
  },
  label: {
    ...typography.caption,
  },
  labelActive: {
    ...typography.heading,
    fontSize: 14,
  },
  badge: {
    ...typography.micro,
    letterSpacing: 0,
  },
});
