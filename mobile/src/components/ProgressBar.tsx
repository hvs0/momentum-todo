import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useColors } from '../theme';

interface Props {
  ratio: number;
  height?: number;
  color?: string;
}

export function ProgressBar({ ratio, height = 6, color }: Props) {
  const colors = useColors();
  const grow = useRef(new Animated.Value(0)).current;
  const safe = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;

  useEffect(() => {
    Animated.spring(grow, {
      toValue: safe,
      useNativeDriver: false,
      speed: 10,
      bounciness: 4,
    }).start();
  }, [grow, safe]);

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: colors.surfaceAlt },
      ]}>
      <Animated.View
        style={[
          styles.fill,
          {
            borderRadius: height / 2,
            backgroundColor: color ?? colors.accent,
            width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
