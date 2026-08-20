import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextProps, View } from 'react-native';
import { elevation, radius, spacing, typography, useTheme } from '../theme';
import { Task } from '../types';
import { formatTime, relativeDay } from '../utils/date';
import { urgencyLabel } from '../utils/priority';

interface Props {
  task: Task;
  index?: number;
  busy?: boolean;
  onToggle: (task: Task) => void;
  onPress: (task: Task) => void;
  onLongPress: (task: Task) => void;
}

type TextLayout = Parameters<NonNullable<TextProps['onTextLayout']>>[0];

const TITLE_LINE_HEIGHT = 22;

function isOverdue(task: Task) {
  return !task.completed && !!task.deadline && new Date(task.deadline).getTime() < Date.now();
}

function TaskCardBase({ task, index = 0, busy = false, onToggle, onPress, onLongPress }: Props) {
  const { colors, isDark } = useTheme();
  const accent = colors.priority[task.priority];
  const overdue = isOverdue(task);

  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const done = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const [lineWidths, setLineWidths] = useState<number[]>([]);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index, 8) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  useEffect(() => {
    Animated.spring(done, {
      toValue: task.completed ? 1 : 0,
      useNativeDriver: false,
      speed: 14,
      bounciness: 8,
    }).start();
  }, [done, task.completed]);

  const onTextLayout = (event: TextLayout) => {
    const widths = event.nativeEvent.lines.map((line: { width: number }) => line.width);
    setLineWidths((current) =>
      current.length === widths.length && current.every((value, i) => value === widths[i])
        ? current
        : widths,
    );
  };

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) },
        ],
      }}>
      <Pressable
        onPress={() => onPress(task)}
        onLongPress={() => onLongPress(task)}
        onPressIn={() =>
          Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 45 }).start()
        }
        onPressOut={() =>
          Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 20 }).start()
        }
        delayLongPress={350}
        style={[
          styles.card,
          elevation('card', isDark),
          {
            backgroundColor: colors.surface,
            borderColor: overdue ? colors.danger : colors.border,
          },
          busy && styles.busy,
        ]}>
        <Pressable onPress={() => onToggle(task)} hitSlop={12} style={styles.checkboxHit}>
          <Animated.View
            style={[
              styles.checkbox,
              {
                borderColor: task.completed ? colors.success : colors.borderStrong,
                backgroundColor: done.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', colors.success],
                }),
              },
            ]}>
            <Animated.View
              style={[
                styles.tick,
                {
                  borderColor: colors.surface,
                  opacity: done,
                  transform: [
                    { rotate: '45deg' },
                    { scale: done.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                  ],
                },
              ]}
            />
          </Animated.View>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrap}>
              <Animated.Text
                style={[
                  styles.title,
                  {
                    color: done.interpolate({
                      inputRange: [0, 1],
                      outputRange: [colors.text, colors.textFaint],
                    }),
                  },
                ]}
                numberOfLines={2}
                onTextLayout={onTextLayout}>
                {task.title}
              </Animated.Text>

              {lineWidths.map((lineWidth, line) => (
                <Animated.View
                  key={line}
                  style={[
                    styles.strike,
                    {
                      backgroundColor: colors.textFaint,
                      top: line * TITLE_LINE_HEIGHT + TITLE_LINE_HEIGHT / 2,
                      width: done.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, lineWidth],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

            <View style={[styles.priorityDot, { backgroundColor: accent }]} />
          </View>

          {task.description ? (
            <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.textFaint }]}>
              {relativeDay(task.dateTime)} · {formatTime(new Date(task.dateTime))}
            </Text>

            <Text
              style={[
                styles.deadline,
                { color: overdue ? colors.danger : colors.textMuted },
              ]}>
              {task.completed ? 'Done' : urgencyLabel(task)}
            </Text>
          </View>

          {task.category || task.tags.length || task.repeat !== 'none' || task.subtasks.length ? (
            <View style={styles.tagRow}>
              {task.category ? (
                <Text style={[styles.category, { color: colors.textMuted }]}>{task.category}</Text>
              ) : null}

              {task.repeat !== 'none' ? (
                <Text style={[styles.category, { color: colors.accent }]}>repeats {task.repeat}</Text>
              ) : null}

              {task.subtasks.length ? (
                <Text style={[styles.category, { color: colors.textMuted }]}>
                  {task.subtasks.filter((item) => item.done).length}/{task.subtasks.length} steps
                </Text>
              ) : null}
              {task.tags.slice(0, 3).map((tag) => (
                <Text key={tag} style={[styles.tag, { color: colors.textFaint }]}>
                  #{tag}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const TaskCard = memo(TaskCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(3),
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing(4),
  },
  busy: {
    opacity: 0.55,
  },
  checkboxHit: {
    marginTop: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 6,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    marginTop: -2,
  },
  body: {
    flex: 1,
    gap: spacing(1.5),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(2),
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    lineHeight: TITLE_LINE_HEIGHT,
  },
  strike: {
    position: 'absolute',
    left: 0,
    height: 1,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
  },
  description: {
    ...typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    marginTop: spacing(0.5),
  },
  meta: {
    ...typography.caption,
    flex: 1,
  },
  deadline: {
    ...typography.caption,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(0.5),
  },
  category: {
    ...typography.micro,
  },
  tag: {
    ...typography.micro,
    letterSpacing: 0,
  },
});
