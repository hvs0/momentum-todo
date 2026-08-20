import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TextStyle } from 'react-native';

interface Props {
  value: number;
  style?: TextStyle | TextStyle[];
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({ value, style, suffix = '', duration = 700 }: Props) {
  const progress = useRef(new Animated.Value(value)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const listener = progress.addListener(({ value: current }) => {
      setDisplay(Math.round(current));
    });

    return () => progress.removeListener(listener);
  }, [progress]);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;

    Animated.parallel([
      Animated.timing(progress, {
        toValue: value,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.spring(pop, { toValue: 1.22, useNativeDriver: true, speed: 40, bounciness: 14 }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      ]),
    ]).start();
  }, [duration, pop, progress, value]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pop }] }]}>
      <Text style={style}>
        {display}
        {suffix}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
});
