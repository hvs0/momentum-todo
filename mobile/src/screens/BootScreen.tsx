import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useColors } from '../theme';

export function BootScreen() {
  const colors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[styles.wordmark, { color: colors.text }]}>Momentum</Text>
      <View style={[styles.rule, { backgroundColor: colors.borderStrong }]} />
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(4),
  },
  wordmark: {
    ...typography.display,
  },
  rule: {
    width: 40,
    height: 1,
  },
});
