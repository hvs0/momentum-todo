import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useColors } from '../theme';

interface Props {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: Props) {
  const colors = useColors();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.rule, { backgroundColor: colors.borderStrong }]} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(8),
    gap: spacing(2.5),
  },
  rule: {
    width: 34,
    height: 1,
    marginBottom: spacing(3),
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
  },
});
