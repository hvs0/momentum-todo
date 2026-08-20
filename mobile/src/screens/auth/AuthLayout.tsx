import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { ThemeToggle } from '../../components/ThemeToggle';
import { spacing, typography, useColors } from '../../theme';

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function AuthLayout({ eyebrow, title, subtitle, children }: PropsWithChildren<Props>) {
  const colors = useColors();

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.toggleRow}>
          <ThemeToggle />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow.toUpperCase()}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <View style={[styles.rule, { backgroundColor: colors.borderStrong }]} />
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>

          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  toggleRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing(6),
    paddingTop: spacing(2),
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing(6),
    paddingTop: spacing(6),
    paddingBottom: spacing(10),
    justifyContent: 'center',
  },
  header: {
    gap: spacing(2),
    marginBottom: spacing(8),
  },
  eyebrow: {
    ...typography.micro,
  },
  title: {
    ...typography.display,
  },
  rule: {
    width: 40,
    height: 1,
    marginVertical: spacing(1),
  },
  subtitle: {
    ...typography.body,
    maxWidth: 320,
  },
  form: {
    gap: spacing(5),
  },
});
