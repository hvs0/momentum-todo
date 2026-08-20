import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useColors } from '../theme';
import { formatDate, formatTime, mergeDateAndTime } from '../utils/date';

interface Props {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  clearable?: boolean;
  minimumDate?: Date;
  emptyLabel?: string;
}

type Stage = 'idle' | 'date' | 'time';

export function DateTimeField({
  label,
  value,
  onChange,
  clearable = false,
  minimumDate,
  emptyLabel = 'Not set',
}: Props) {
  const colors = useColors();
  const [stage, setStage] = useState<Stage>('idle');
  const [draftDate, setDraftDate] = useState<Date | null>(null);

  const open = () => {
    setDraftDate(value ?? new Date());
    setStage('date');
  };

  const handleDatePicked = (_event: unknown, picked: Date) => {
    setDraftDate(picked);
    setStage('time');
  };

  const handleTimePicked = (_event: unknown, picked: Date) => {
    setStage('idle');
    onChange(mergeDateAndTime(draftDate ?? new Date(), picked));
  };

  const cancel = () => setStage('idle');
  const display = Platform.OS === 'ios' ? 'spinner' : 'default';

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        {clearable && value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={10}>
            <Text style={[styles.clear, { color: colors.danger }]}>CLEAR</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={open}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.valueBlock}>
          <Text style={[styles.value, { color: value ? colors.text : colors.textFaint }]}>
            {value ? formatDate(value) : emptyLabel}
          </Text>
          {value ? (
            <Text style={[styles.time, { color: colors.accent }]}>{formatTime(value)}</Text>
          ) : null}
        </View>
      </Pressable>

      {stage === 'date' ? (
        <DateTimePicker
          mode="date"
          display={display}
          value={draftDate ?? new Date()}
          minimumDate={minimumDate}
          onValueChange={handleDatePicked}
          onDismiss={cancel}
        />
      ) : null}

      {stage === 'time' ? (
        <DateTimePicker
          mode="time"
          display={display}
          value={draftDate ?? new Date()}
          onValueChange={handleTimePicked}
          onDismiss={cancel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing(1.5),
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.micro,
  },
  clear: {
    ...typography.micro,
  },
  field: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  valueBlock: {
    gap: 2,
  },
  value: {
    ...typography.body,
  },
  time: {
    ...typography.caption,
  },
});
