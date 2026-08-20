import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { radius, spacing, useColors } from '../theme';

export function SkeletonCard({ index = 0 }: { index?: number }) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          delay: index * 140,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [index, pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity },
      ]}>
      <View style={[styles.checkbox, { backgroundColor: colors.skeleton }]} />

      <View style={styles.body}>
        <View style={[styles.line, styles.lineWide, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.line, styles.lineFull, { backgroundColor: colors.skeleton }]} />
        <View style={styles.metaRow}>
          <View style={[styles.line, styles.lineShort, { backgroundColor: colors.skeleton }]} />
          <View style={[styles.pill, { backgroundColor: colors.skeleton }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing(3),
    padding: spacing(4),
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: spacing(2.5),
  },
  line: {
    height: 12,
    borderRadius: 4,
  },
  lineWide: {
    width: '68%',
  },
  lineFull: {
    width: '90%',
    height: 10,
  },
  lineShort: {
    width: 92,
    height: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    width: 56,
    height: 12,
    borderRadius: 4,
  },
});
