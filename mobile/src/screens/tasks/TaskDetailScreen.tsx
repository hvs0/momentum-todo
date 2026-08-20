import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  deleteTask,
  optimisticSubtaskToggle,
  optimisticToggle,
  toggleSubtask,
  toggleTask,
} from '../../features/tasks/tasksSlice';
import { AppStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useColors } from '../../theme';
import { formatDateTime } from '../../utils/date';
import { urgencyLabel } from '../../utils/priority';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskDetail'>;

const REPEAT_LABELS: Record<string, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
};

export function TaskDetailScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const colors = useColors();
  const { taskId } = route.params;

  const task = useAppSelector((state) => state.tasks.items.find((item) => item.id === taskId));
  const busy = useAppSelector((state) => state.tasks.busyIds.includes(taskId));

  const onDelete = useCallback(() => {
    if (!task) return;

    Alert.alert('Delete task', 'Remove "' + task.title + '" for good?', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(deleteTask(task.id));
          navigation.goBack();
        },
      },
    ]);
  }, [dispatch, navigation, task]);

  const onSubtaskToggle = useCallback(
    (subtaskId: string) => {
      dispatch(optimisticSubtaskToggle({ taskId, subtaskId }));
      dispatch(toggleSubtask({ taskId, subtaskId }));
    },
    [dispatch, taskId],
  );

  if (!task) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Text style={[styles.missingTitle, { color: colors.text }]}>This task is gone</Text>
          <Button label="Back to list" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const accent = colors.priority[task.priority];
  const overdue =
    !task.completed && !!task.deadline && new Date(task.deadline).getTime() < Date.now();

  const doneSubtasks = task.subtasks.filter((item) => item.done).length;

  const rows = [
    { label: 'Starts', value: formatDateTime(task.dateTime), tint: undefined as string | undefined },
    {
      label: 'Deadline',
      value: task.deadline ? formatDateTime(task.deadline) : 'No deadline',
      tint: overdue ? colors.danger : undefined,
    },
    {
      label: 'Status',
      value: task.completed ? 'Completed' : task.deadline ? urgencyLabel(task) : 'In progress',
      tint: task.completed ? colors.success : overdue ? colors.danger : undefined,
    },
    { label: 'Repeats', value: REPEAT_LABELS[task.repeat] ?? 'Does not repeat', tint: undefined },
    { label: 'Category', value: task.category, tint: undefined },
    ...(task.completedAt
      ? [{ label: 'Completed', value: formatDateTime(task.completedAt), tint: undefined }]
      : []),
  ];

  return (
    <Screen>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.back, { color: colors.textMuted }]}>Back</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('TaskForm', { taskId: task.id })} hitSlop={12}>
          <Text style={[styles.edit, { color: colors.accent }]}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headline}>
          <View style={styles.priorityRow}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text style={[styles.priorityText, { color: colors.textMuted }]}>
              {task.priority.toUpperCase()} PRIORITY
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              { color: task.completed ? colors.textMuted : colors.text },
              task.completed && styles.titleDone,
            ]}>
            {task.title}
          </Text>

          {task.description ? (
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {task.description}
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { borderColor: colors.border }]}>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.row,
                index > 0 && styles.rowDivided,
                index > 0 && { borderTopColor: colors.border },
              ]}>
              <Text style={[styles.rowLabel, { color: colors.textFaint }]}>
                {row.label.toUpperCase()}
              </Text>
              <Text style={[styles.rowValue, { color: row.tint ?? colors.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {task.subtasks.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>CHECKLIST</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {doneSubtasks} of {task.subtasks.length}
              </Text>
            </View>

            <ProgressBar ratio={doneSubtasks / task.subtasks.length} height={4} />

            <View style={[styles.card, { borderColor: colors.border }]}>
              {task.subtasks.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => onSubtaskToggle(item.id)}
                  style={[
                    styles.subtaskRow,
                    index > 0 && styles.rowDivided,
                    index > 0 && { borderTopColor: colors.border },
                  ]}>
                  <View
                    style={[
                      styles.box,
                      {
                        borderColor: item.done ? colors.success : colors.borderStrong,
                        backgroundColor: item.done ? colors.success : colors.surface,
                      },
                    ]}>
                    {item.done ? (
                      <View style={[styles.tick, { borderColor: colors.surface }]} />
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.subtaskText,
                      { color: item.done ? colors.textFaint : colors.text },
                      item.done && styles.subtaskDone,
                    ]}>
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {task.tags.length ? (
          <View style={styles.tagBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>TAGS</Text>
            <View style={styles.tagRow}>
              {task.tags.map((tag) => (
                <Chip key={tag} label={'#' + tag} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={task.completed ? 'Mark as active' : 'Mark as done'}
            onPress={() => {
              dispatch(optimisticToggle(task.id));
              dispatch(toggleTask(task.id));
            }}
            loading={busy}
          />
          <Button label="Delete task" variant="danger" onPress={onDelete} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(4),
    borderBottomWidth: 1,
  },
  back: {
    ...typography.body,
  },
  edit: {
    ...typography.body,
  },
  content: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(6),
    paddingBottom: spacing(14),
    gap: spacing(6),
  },
  headline: {
    gap: spacing(3),
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  priorityText: {
    ...typography.micro,
  },
  title: {
    ...typography.display,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  description: {
    ...typography.body,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(4),
    paddingVertical: spacing(3.5),
  },
  rowDivided: {
    borderTopWidth: 1,
  },
  rowLabel: {
    ...typography.micro,
  },
  rowValue: {
    ...typography.body,
    flex: 1,
    textAlign: 'right',
  },
  section: {
    gap: spacing(2.5),
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...typography.micro,
  },
  sectionCount: {
    ...typography.micro,
    letterSpacing: 0,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3.5),
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
  subtaskText: {
    ...typography.body,
    flex: 1,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
  },
  tagBlock: {
    gap: spacing(2.5),
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  actions: {
    gap: spacing(3),
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(4),
    paddingHorizontal: spacing(8),
  },
  missingTitle: {
    ...typography.title,
  },
});
