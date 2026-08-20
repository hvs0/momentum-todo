import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, typography, useColors } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  secureToggle?: boolean;
}

type TextInputHandle = React.ComponentRef<typeof TextInput>;
type FocusEvent = Parameters<NonNullable<TextInputProps['onFocus']>>[0];

export const TextField = forwardRef<TextInputHandle, Props>(function Field(
  { label, error, hint, secureToggle = false, style, onFocus, onBlur, ...rest },
  ref,
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureToggle);

  const handleFocus = (event: FocusEvent) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent) => {
    setFocused(false);
    onBlur?.(event);
  };

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>

      <View style={[styles.field, { borderColor, backgroundColor: colors.surface }]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          secureTextEntry={secureToggle ? hidden : rest.secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: colors.text }, style]}
          {...rest}
        />

        {secureToggle ? (
          <Pressable onPress={() => setHidden((value) => !value)} hitSlop={12}>
            <Text style={[styles.reveal, { color: colors.accent }]}>
              {hidden ? 'SHOW' : 'HIDE'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: colors.textFaint }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing(1.5),
  },
  label: {
    ...typography.micro,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing(4),
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing(3.5),
  },
  reveal: {
    ...typography.micro,
  },
  helper: {
    ...typography.caption,
  },
});
