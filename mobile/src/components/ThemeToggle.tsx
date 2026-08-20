import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';
import { MODE_GLYPHS, MODE_LABELS, THEME_MODES, ThemeMode } from '../utils/daylight';

const MODE_HINTS: Record<ThemeMode, string> = {
  auto: 'Light in the day, dark after 6pm',
  system: 'Follows your phone setting',
  light: 'Always light',
  dark: 'Always dark',
};

export function ThemeToggle() {
  const { colors, mode, glyph, label, toggle, setMode } = useTheme();
  const [picking, setPicking] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, spin]);

  return (
    <>
      <Pressable
        onPress={toggle}
        onLongPress={() => setPicking(true)}
        delayLongPress={300}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={'Theme: ' + label + '. Tap to change, hold to pick.'}
        style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Animated.View
          style={{
            transform: [
              { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
            ],
            opacity: spin,
          }}>
          <Text style={[styles.glyph, { color: colors.accent }]}>{glyph}</Text>
        </Animated.View>
      </Pressable>

      <Modal
        visible={picking}
        transparent
        animationType="fade"
        onRequestClose={() => setPicking(false)}>
        <Pressable style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={() => setPicking(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.textFaint }]}>APPEARANCE</Text>

            {THEME_MODES.map((option, index) => {
              const active = option === mode;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setMode(option);
                    setPicking(false);
                  }}
                  style={[
                    styles.option,
                    index > 0 && styles.optionDivided,
                    index > 0 && { borderTopColor: colors.border },
                  ]}>
                  <Text style={[styles.optionGlyph, { color: colors.accent }]}>
                    {MODE_GLYPHS[option]}
                  </Text>

                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {MODE_LABELS[option]}
                    </Text>
                    <Text style={[styles.optionHint, { color: colors.textMuted }]}>
                      {MODE_HINTS[option]}
                    </Text>
                  </View>

                  {active ? (
                    <View style={[styles.tickCircle, { backgroundColor: colors.success }]}>
                      <View style={[styles.tick, { borderColor: colors.surface }]} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    ...typography.body,
    fontSize: 16,
  },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
  },
  sheet: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  sheetTitle: {
    ...typography.micro,
    paddingVertical: spacing(2),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
    paddingVertical: spacing(3.5),
  },
  optionDivided: {
    borderTopWidth: 1,
  },
  optionGlyph: {
    ...typography.body,
    fontSize: 17,
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.body,
  },
  optionHint: {
    ...typography.caption,
  },
  tickCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 5,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
});
