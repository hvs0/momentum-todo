import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useColors } from '../theme';

interface Props {
  message: string;
  tone?: 'error' | 'info';
  onDismiss?: () => void;
}

export function Banner({ message, tone = 'error', onDismiss }: Props) {
  const colors = useColors();
  const accent = tone === 'error' ? colors.danger : colors.accent;

  return (
    <View style={[styles.banner, { borderColor: accent, backgroundColor: colors.surface }]}>
      <View style={[styles.rule, { backgroundColor: accent }]} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={[styles.dismiss, { color: accent }]}>CLOSE</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
  },
  rule: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  message: {
    ...typography.caption,
    flex: 1,
  },
  dismiss: {
    ...typography.micro,
  },
});
