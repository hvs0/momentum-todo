import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, spacing, typography, useColors } from '../theme';
import { SubtaskDraft } from '../types';

interface Props {
  value: SubtaskDraft[];
  onChange: (next: SubtaskDraft[]) => void;
  max?: number;
}

export function SubtaskEditor({ value, onChange, max = 20 }: Props) {
  const colors = useColors();
  const [draft, setDraft] = useState('');

  const add = () => {
    const title = draft.trim();
    if (!title || value.length >= max) return;

    onChange([...value, { title, done: false }]);
    setDraft('');
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const toggle = (index: number) => {
    onChange(value.map((item, i) => (i === index ? { ...item, done: !item.done } : item)));
  };

  const doneCount = value.filter((item) => item.done).length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textFaint }]}>CHECKLIST</Text>
        {value.length ? (
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {doneCount} of {value.length}
          </Text>
        ) : null}
      </View>

      {value.map((item, index) => (
        <View
          key={item.id ?? index}
          style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Pressable onPress={() => toggle(index)} hitSlop={10}>
            <View
              style={[
                styles.box,
                {
                  borderColor: item.done ? colors.success : colors.borderStrong,
                  backgroundColor: item.done ? colors.success : colors.surface,
                },
              ]}>
              {item.done ? <View style={[styles.tick, { borderColor: colors.surface }]} /> : null}
            </View>
          </Pressable>

          <Text
            style={[
              styles.rowText,
              { color: item.done ? colors.textFaint : colors.text },
              item.done && styles.rowTextDone,
            ]}
            numberOfLines={2}>
            {item.title}
          </Text>

          <Pressable onPress={() => remove(index)} hitSlop={10}>
            <Text style={[styles.remove, { color: colors.danger }]}>REMOVE</Text>
          </Pressable>
        </View>
      ))}

      {value.length < max ? (
        <View style={[styles.addRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a step"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
            style={[styles.input, { color: colors.text }]}
            returnKeyType="done"
            onSubmitEditing={add}
            maxLength={120}
          />
          <Pressable onPress={add} hitSlop={10} disabled={!draft.trim()}>
            <Text
              style={[styles.add, { color: draft.trim() ? colors.accent : colors.textFaint }]}>
              ADD
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing(2),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.micro,
  },
  counter: {
    ...typography.micro,
    letterSpacing: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 5,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  rowText: {
    ...typography.body,
    flex: 1,
  },
  rowTextDone: {
    textDecorationLine: 'line-through',
  },
  remove: {
    ...typography.micro,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing(3),
  },
  add: {
    ...typography.micro,
  },
});
