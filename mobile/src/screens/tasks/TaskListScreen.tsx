import React, { useCallback, useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TaskListHeader } from './TaskListHeader';
import { Banner } from '../../components/Banner';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { SkeletonCard } from '../../components/SkeletonCard';
import { TaskCard } from '../../components/TaskCard';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import {
  deleteTask,
  errorCleared,
  fetchStats,
  fetchTasks,
  filtersChanged,
  optimisticToggle,
  toggleTask,
} from '../../features/tasks/tasksSlice';
import {
  selectCategories,
  selectProgress,
  selectVisibleTasks,
} from '../../features/tasks/selectors';
import { AppStackParamList } from '../../navigation/types';
import { elevation, radius, spacing, typography, useTheme } from '../../theme';
import { Task, TaskFilters } from '../../types';
import { requestReminderPermission, syncReminders } from '../../utils/reminders';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskList'>;

function Separator() {
  return <View style={styles.separator} />;
}

export function TaskListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();

  const user = useAppSelector((state) => state.auth.user);
  const tasks = useAppSelector(selectVisibleTasks);
  const categories = useAppSelector(selectCategories);
  const progress = useAppSelector(selectProgress);
  const filters = useAppSelector((state) => state.tasks.filters);
  const loading = useAppSelector((state) => state.tasks.loading);
  const refreshing = useAppSelector((state) => state.tasks.refreshing);
  const busyIds = useAppSelector((state) => state.tasks.busyIds);
  const error = useAppSelector((state) => state.tasks.error);
  const allTasks = useAppSelector((state) => state.tasks.items);

  const fabPress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchTasks(undefined));
    dispatch(fetchStats());
    requestReminderPermission().catch(() => undefined);
  }, [dispatch]);

  useEffect(() => {
    syncReminders(allTasks).catch(() => undefined);
  }, [allTasks]);

  const onRefresh = useCallback(() => {
    dispatch(fetchTasks({ refreshing: true }));
    dispatch(fetchStats());
  }, [dispatch]);

  const onFilterChange = useCallback(
    (patch: Partial<TaskFilters>) => {
      dispatch(filtersChanged(patch));
    },
    [dispatch],
  );

  const onToggle = useCallback(
    (task: Task) => {
      dispatch(optimisticToggle(task.id));
      dispatch(toggleTask(task.id));
    },
    [dispatch],
  );

  const onOpen = useCallback(
    (task: Task) => {
      navigation.navigate('TaskDetail', { taskId: task.id });
    },
    [navigation],
  );

  const onLongPress = useCallback(
    (task: Task) => {
      Alert.alert('Delete task', 'Remove "' + task.title + '" for good?', [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTask(task.id));
          },
        },
      ]);
    },
    [dispatch],
  );

  const onSignOut = useCallback(() => {
    Alert.alert('Sign out', 'You will need to sign in again to see your tasks.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  }, [dispatch]);

  return (
    <Screen>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <TaskListHeader
              name={user?.name ?? 'there'}
              progress={progress}
              filters={filters}
              categories={categories}
              onFilterChange={onFilterChange}
              onSignOut={onSignOut}
              onOpenInsights={() => navigation.navigate('Insights')}
            />

            {error ? <Banner message={error} onDismiss={() => dispatch(errorCleared())} /> : null}

            {loading ? (
              <View style={styles.skeletons}>
                {[0, 1, 2].map((index) => (
                  <SkeletonCard key={index} index={index} />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={filters.search ? 'Nothing matches' : 'A clean slate'}
              message={
                filters.search
                  ? 'Try a different search term or clear the filters.'
                  : 'Add your first task and it will show up right here, sorted by what matters most.'
              }
            />
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <TaskCard
            task={item}
            index={index}
            busy={busyIds.includes(item.id)}
            onToggle={onToggle}
            onPress={onOpen}
            onLongPress={onLongPress}
          />
        )}
        ItemSeparatorComponent={Separator}
      />

      <Animated.View
        style={[
          styles.fab,
          elevation('float', isDark),
          {
            backgroundColor: colors.accent,
            transform: [
              { scale: fabPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
            ],
          },
        ]}>
        <Pressable
          onPress={() => navigation.navigate('TaskForm')}
          onPressIn={() =>
            Animated.spring(fabPress, { toValue: 1, useNativeDriver: true, speed: 45 }).start()
          }
          onPressOut={() =>
            Animated.spring(fabPress, { toValue: 0, useNativeDriver: true, speed: 20 }).start()
          }
          style={styles.fabInner}>
          <Text style={[styles.fabPlus, { color: colors.accentContrast }]}>+</Text>
          <Text style={[styles.fabLabel, { color: colors.accentContrast }]}>New task</Text>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
    paddingBottom: spacing(30),
  },
  headerBlock: {
    gap: spacing(4),
    marginBottom: spacing(4),
  },
  separator: {
    height: spacing(3),
  },
  skeletons: {
    gap: spacing(3),
  },
  fab: {
    position: 'absolute',
    right: spacing(5),
    bottom: spacing(6),
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3.5),
  },
  fabPlus: {
    ...typography.title,
    marginTop: -3,
  },
  fabLabel: {
    ...typography.heading,
  },
});
