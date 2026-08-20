import React, { useEffect, useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { EmptyState } from '../../components/EmptyState';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchStats } from '../../features/tasks/tasksSlice';
import { AppStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useColors } from '../../theme';
import { PRIORITIES } from '../../types';

type Props = NativeStackScreenProps<AppStackParamList, 'Insights'>;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function InsightsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const colors = useColors();
  const stats = useAppSelector((state) => state.tasks.stats);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const peak = useMemo(
    () => Math.max(1, ...(stats?.trend ?? []).map((point) => point.count)),
    [stats],
  );

  const weekTotal = useMemo(
    () => (stats?.trend ?? []).reduce((sum, point) => sum + point.count, 0),
    [stats],
  );

  const maxCategory = useMemo(
    () => Math.max(1, ...(stats?.byCategory ?? []).map((row) => row.count)),
    [stats],
  );

  return (
    <Screen>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.back, { color: colors.textMuted }]}>Back</Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>Insights</Text>
        <View style={styles.topSpacer} />
      </View>

      {!stats || stats.total === 0 ? (
        <EmptyState
          title="Nothing to measure yet"
          message="Finish a task or two and your streak, weekly trend and breakdowns will show up here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headlineRow}>
            <View style={[styles.headlineCard, { borderColor: colors.border }]}>
              <AnimatedNumber
                value={stats.streak}
                style={[styles.headlineValue, { color: colors.accent }]}
              />
              <Text style={[styles.headlineLabel, { color: colors.textMuted }]}>
                {stats.streak === 1 ? 'DAY STREAK' : 'DAY STREAK'}
              </Text>
            </View>

            <View style={[styles.headlineCard, { borderColor: colors.border }]}>
              <AnimatedNumber
                value={weekTotal}
                style={[styles.headlineValue, { color: colors.success }]}
              />
              <Text style={[styles.headlineLabel, { color: colors.textMuted }]}>DONE THIS WEEK</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>LAST SEVEN DAYS</Text>
            <View style={[styles.chartCard, { borderColor: colors.border }]}>
              <View style={styles.chart}>
                {stats.trend.map((point) => {
                  const height = Math.round((point.count / peak) * 90);
                  const weekday = WEEKDAYS[new Date(point.date + 'T00:00:00').getDay()];

                  return (
                    <View key={point.date} style={styles.barColumn}>
                      <Text style={[styles.barValue, { color: colors.textMuted }]}>
                        {point.count > 0 ? point.count : ''}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(height, 3),
                            backgroundColor: point.count > 0 ? colors.accent : colors.surfaceAlt,
                          },
                        ]}
                      />
                      <Text style={[styles.barLabel, { color: colors.textFaint }]}>{weekday}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>BY PRIORITY</Text>
            <View style={[styles.listCard, { borderColor: colors.border }]}>
              {PRIORITIES.map((priority) => {
                const count = stats.byPriority[priority] ?? 0;

                return (
                  <View key={priority} style={styles.meterRow}>
                    <View style={styles.meterHead}>
                      <View style={styles.meterName}>
                        <View
                          style={[styles.dot, { backgroundColor: colors.priority[priority] }]}
                        />
                        <Text style={[styles.meterLabel, { color: colors.text }]}>{priority}</Text>
                      </View>
                      <Text style={[styles.meterCount, { color: colors.textMuted }]}>{count}</Text>
                    </View>
                    <ProgressBar
                      ratio={stats.total ? count / stats.total : 0}
                      height={4}
                      color={colors.priority[priority]}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>BY CATEGORY</Text>
            <View style={[styles.listCard, { borderColor: colors.border }]}>
              {stats.byCategory.map((row) => (
                <View key={row.category} style={styles.meterRow}>
                  <View style={styles.meterHead}>
                    <Text style={[styles.meterLabel, { color: colors.text }]}>{row.category}</Text>
                    <Text style={[styles.meterCount, { color: colors.textMuted }]}>{row.count}</Text>
                  </View>
                  <ProgressBar ratio={row.count / maxCategory} height={4} />
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.footerCard, { borderColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              {stats.completed} of {stats.total} tasks completed
              {stats.overdue > 0 ? ' · ' + stats.overdue + ' overdue' : ''}
            </Text>
          </View>
        </ScrollView>
      )}
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
    paddingTop: spacing(6),
    paddingBottom: spacing(14),
    gap: spacing(6),
  },
  headlineRow: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  headlineCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing(1),
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(5),
  },
  headlineValue: {
    ...typography.display,
  },
  headlineLabel: {
    ...typography.micro,
  },
  section: {
    gap: spacing(2.5),
  },
  sectionLabel: {
    ...typography.micro,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barColumn: {
    alignItems: 'center',
    gap: spacing(1.5),
    flex: 1,
  },
  bar: {
    width: 18,
    borderRadius: 4,
  },
  barValue: {
    ...typography.micro,
    letterSpacing: 0,
  },
  barLabel: {
    ...typography.micro,
    letterSpacing: 0,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(3.5),
  },
  meterRow: {
    gap: spacing(1.5),
  },
  meterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  meterLabel: {
    ...typography.body,
  },
  meterCount: {
    ...typography.caption,
  },
  footerCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
  },
});
