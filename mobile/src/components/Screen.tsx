import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface Props {
  edges?: readonly Edge[];
  style?: ViewStyle;
  animateIn?: boolean;
}

export function Screen({
  children,
  edges = ['top'],
  style,
  animateIn = true,
}: PropsWithChildren<Props>) {
  const { colors, isDark } = useTheme();
  const enter = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (!animateIn) return;

    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animateIn, enter]);

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Animated.View
        style={[
          styles.content,
          style,
          {
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            ],
          },
        ]}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
