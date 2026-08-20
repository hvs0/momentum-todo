import React, { useCallback, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { DateTimeField } from '../../components/DateTimeField';
import { Screen } from '../../components/Screen';
import { SubtaskEditor } from '../../components/SubtaskEditor';
import { TextField } from '../../components/TextField';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createTask, errorCleared, updateTask } from '../../features/tasks/tasksSlice';
import { selectCategories } from '../../features/tasks/selectors';
import { AppStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useColors } from '../../theme';
import { PRIORITIES, Priority, Repeat, REPEATS, SubtaskDraft, TaskDraft } from '../../types';
import { roundToNextQuarterHour } from '../../utils/date';
import { scoreTask } from '../../utils/priority';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskForm'>;

const QUICK_CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Errands', 'Study'];

const PRIORITY_HINTS: Record<Priority, string> = {
  low: 'Nice to have, no pressure',
  medium: 'Normal day-to-day work',
  high: 'Needs attention soon',
  urgent: 'Drop everything for this',
};

const REPEAT_LABELS: Record<Repeat, string> = {
  none: 'One-off',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function TaskFormScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const colors = useColors();
  const taskId = route.params?.taskId;

  const existing = useAppSelector((state) =>
    taskId ? state.tasks.items.find((item) => item.id === taskId) : undefined,
  );
  const saving = useAppSelector((state) => state.tasks.saving);
  const error = useAppSelector((state) => state.tasks.error);
  const knownCategories = useAppSelector(selectCategories);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [dateTime, setDateTime] = useState<Date>(
    existing ? new Date(existing.dateTime) : roundToNextQuarterHour(),
  );
  const [deadline, setDeadline] = useState<Date | null>(
    existing?.deadline ? new Date(existing.deadline) : null,
  );
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [repeat, setRepeat] = useState<Repeat>(existing?.repeat ?? 'none');
  const [category, setCategory] = useState(existing?.category ?? 'General');
  const [tagText, setTagText] = useState((existing?.tags ?? []).join(', '));
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>(
    (existing?.subtasks ?? []).map((item) => ({ id: item.id, title: item.title, done: item.done })),
  );
  const [touched, setTouched] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set([...QUICK_CATEGORIES, ...knownCategories])),
    [knownCategories],
  );

  const tags = useMemo(
    () =>
      tagText
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean)
        .slice(0, 10),
    [tagText],
  );

  const titleError = title.trim() ? null : 'Give the task a title';
  const deadlineError =
    deadline && deadline.getTime() < dateTime.getTime()
      ? 'Deadline cannot be before the start time'
      : null;

  const canSave = !titleError && !deadlineError && !saving;

  const previewScore = useMemo(
    () =>
      scoreTask({
        priority,
        dateTime: dateTime.toISOString(),
        deadline: deadline ? deadline.toISOString() : null,
        completed: false,
      }),
    [dateTime, deadline, priority],
  );

  const onSave = useCallback(() => {
    setTouched(true);
    if (!canSave) return;

    const draft: TaskDraft = {
      title: title.trim(),
      description: description.trim(),
      dateTime: dateTime.toISOString(),
      deadline: deadline ? deadline.toISOString() : null,
      priority,
      repeat,
      category: category.trim() || 'General',
      tags,
      subtasks,
    };

    const pending = taskId
      ? dispatch(updateTask({ id: taskId, patch: draft }))
      : dispatch(createTask(draft));

    pending
      .unwrap()
      .then(() => navigation.goBack())
      .catch(() => undefined);
  }, [
    canSave,
    category,
    dateTime,
    deadline,
    description,
    dispatch,
    navigation,
    priority,
    repeat,
    subtasks,
    tags,
    taskId,
    title,
  ]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={[styles.back, { color: colors.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.text }]}>
            {taskId ? 'Edit task' : 'New task'}
          </Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {error ? <Banner message={error} onDismiss={() => dispatch(errorCleared())} /> : null}

          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            error={touched ? titleError : null}
            placeholder="What needs doing?"
            autoFocus={!taskId}
            maxLength={120}
          />

          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add the details you will want later"
            multiline
            numberOfLines={4}
            maxLength={2000}
            style={styles.multiline}
          />

          <View style={styles.row}>
            <DateTimeField
              label="Starts"
              value={dateTime}
              onChange={(value) => value && setDateTime(value)}
            />
            <DateTimeField
              label="Deadline"
              value={deadline}
              onChange={setDeadline}
              clearable
              emptyLabel="Optional"
            />
          </View>

          {deadlineError ? (
            <Text style={[styles.fieldError, { color: colors.danger }]}>{deadlineError}</Text>
          ) : null}

          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.textFaint }]}>PRIORITY</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((value) => {
                const active = priority === value;

                return (
                  <Pressable
                    key={value}
                    onPress={() => setPriority(value)}
                    style={[
                      styles.priorityCard,
                      {
                        borderColor: active ? colors.priority[value] : colors.border,
                        backgroundColor: active ? colors.accentSoft : colors.surface,
                      },
                    ]}>
                    <View
                      style={[styles.priorityDot, { backgroundColor: colors.priority[value] }]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        { color: active ? colors.text : colors.textMuted },
                      ]}>
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.groupHint, { color: colors.textFaint }]}>
              {PRIORITY_HINTS[priority]}
            </Text>
          </View>

          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.textFaint }]}>REPEATS</Text>
            <View style={styles.chipWrap}>
              {REPEATS.map((option) => (
                <Chip
                  key={option}
                  label={REPEAT_LABELS[option]}
                  selected={repeat === option}
                  onPress={() => setRepeat(option)}
                />
              ))}
            </View>
            {repeat !== 'none' ? (
              <Text style={[styles.groupHint, { color: colors.textFaint }]}>
                Completing this creates the next one automatically.
              </Text>
            ) : null}
          </View>

          <SubtaskEditor value={subtasks} onChange={setSubtasks} />

          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.textFaint }]}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              {categories.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={category === option}
                  onPress={() => setCategory(option)}
                />
              ))}
            </ScrollView>
            <TextField
              label="Or type your own"
              value={category}
              onChangeText={setCategory}
              placeholder="Category name"
              maxLength={40}
            />
          </View>

          <TextField
            label="Tags"
            value={tagText}
            onChangeText={setTagText}
            placeholder="invoice, client, q3"
            hint="Separate tags with commas"
            autoCapitalize="none"
          />

          {tags.length ? (
            <View style={styles.tagPreview}>
              {tags.map((tag) => (
                <Chip key={tag} label={'#' + tag} selected />
              ))}
            </View>
          ) : null}

          <View style={[styles.scoreCard, { borderColor: colors.border }]}>
            <View style={styles.scoreTextBlock}>
              <Text style={[styles.scoreLabel, { color: colors.textFaint }]}>
                SMART SORT WEIGHT
              </Text>
              <Text style={[styles.scoreHint, { color: colors.textMuted }]}>
                How high this task will sit when the list is sorted by Smart
              </Text>
            </View>
            <Text style={[styles.scoreValue, { color: colors.accent }]}>
              {previewScore.toFixed(2)}
            </Text>
          </View>

          <Button
            label={taskId ? 'Save changes' : 'Add task'}
            onPress={onSave}
            loading={saving}
            disabled={!canSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    width: 64,
  },
  topTitle: {
    ...typography.heading,
  },
  topSpacer: {
    width: 64,
  },
  content: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(5),
    paddingBottom: spacing(16),
    gap: spacing(5),
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  fieldError: {
    ...typography.caption,
    marginTop: -spacing(3),
  },
  group: {
    gap: spacing(2.5),
  },
  groupLabel: {
    ...typography.micro,
  },
  groupHint: {
    ...typography.caption,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  priorityCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    ...typography.micro,
    letterSpacing: 0.3,
  },
  chipRow: {
    gap: spacing(2),
    paddingRight: spacing(4),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  tagPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginTop: -spacing(2),
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(4),
    paddingVertical: spacing(4),
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  scoreTextBlock: {
    flex: 1,
    gap: spacing(1),
  },
  scoreLabel: {
    ...typography.micro,
  },
  scoreHint: {
    ...typography.caption,
  },
  scoreValue: {
    ...typography.display,
  },
});
