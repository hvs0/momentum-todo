import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { Chip } from '../../components/Chip';
import { ProgressBar } from '../../components/ProgressBar';
import { SegmentedTabs, TabOption } from '../../components/SegmentedTabs';
import { TextField } from '../../components/TextField';
import { ThemeToggle } from '../../components/ThemeToggle';
import { radius, spacing, typography, useColors } from '../../theme';
import { PRIORITIES, Priority, SortMode, TaskFilters, TaskStatusFilter } from '../../types';
import { greeting } from '../../utils/date';

interface Progress {
  total: number;
  done: number;
  active: number;
  overdue: number;
  ratio: number;
}

interface Props {
  name: string;
  onOpenInsights: () => void;
  progress: Progress;
  filters: TaskFilters;
  categories: string[];
  onFilterChange: (patch: Partial<TaskFilters>) => void;
  onSignOut: () => void;
}

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'smart', label: 'Smart' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'priority', label: 'Priority' },
  { key: 'dateTime', label: 'Start time' },
  { key: 'created', label: 'Newest' },
];

export function TaskListHeader({
  name,
  progress,
  filters,
  categories,
  onFilterChange,
  onSignOut,
  onOpenInsights,
}: Props) {
  const colors = useColors();
  const percent = Math.round(progress.ratio * 100);

  const statusTabs: TabOption<TaskStatusFilter>[] = [
    { key: 'all', label: 'All', badge: progress.total },
    { key: 'active', label: 'Active', badge: progress.active },
    { key: 'completed', label: 'Done', badge: progress.done },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting()}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        </View>

        <View style={styles.topActions}>
          <Pressable
            onPress={onOpenInsights}
            hitSlop={10}
            style={[styles.iconButton, { borderColor: colors.border }]}>
            <Text style={[styles.iconGlyph, { color: colors.accent }]}>📊</Text>
          </Pressable>
          <ThemeToggle />
          <Pressable
            onPress={onSignOut}
            hitSlop={10}
            style={[styles.signOut, { borderColor: colors.border }]}>
            <Text style={[styles.signOutLabel, { color: colors.textMuted }]}>SIGN OUT</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statTop}>
          <View style={styles.percentBlock}>
            <AnimatedNumber
              value={percent}
              suffix="%"
              style={[styles.percent, { color: colors.text }]}
            />
            <Text style={[styles.percentCaption, { color: colors.textMuted }]}>
              {progress.done} of {progress.total} done
            </Text>
          </View>

          {progress.overdue > 0 ? (
            <View style={[styles.overdueBadge, { borderColor: colors.danger }]}>
              <Text style={[styles.overdueText, { color: colors.danger }]}>
                {progress.overdue} OVERDUE
              </Text>
            </View>
          ) : null}
        </View>

        <ProgressBar ratio={progress.ratio} />

        <View style={styles.statRow}>
          <Stat value={progress.active} label="Active" color={colors.text} muted={colors.textMuted} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stat value={progress.done} label="Done" color={colors.success} muted={colors.textMuted} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stat
            value={progress.overdue}
            label="Overdue"
            color={progress.overdue > 0 ? colors.danger : colors.textFaint}
            muted={colors.textMuted}
          />
        </View>
      </View>

      <TextField
        label="Search"
        value={filters.search}
        onChangeText={(value) => onFilterChange({ search: value })}
        placeholder="Find a task, tag or note"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <SegmentedTabs
        options={statusTabs}
        value={filters.status}
        onChange={(status) => onFilterChange({ status })}
      />

      <View style={styles.filterGroup}>
        <Text style={[styles.filterTitle, { color: colors.textFaint }]}>PRIORITY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          <Chip
            label="Any"
            selected={filters.priority === null}
            onPress={() => onFilterChange({ priority: null })}
          />
          {PRIORITIES.map((priority: Priority) => (
            <Chip
              key={priority}
              label={priority}
              tint={colors.priority[priority]}
              selected={filters.priority === priority}
              onPress={() =>
                onFilterChange({ priority: filters.priority === priority ? null : priority })
              }
            />
          ))}
        </ScrollView>
      </View>

      {categories.length > 1 ? (
        <View style={styles.filterGroup}>
          <Text style={[styles.filterTitle, { color: colors.textFaint }]}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}>
            <Chip
              label="All"
              selected={filters.category === null}
              onPress={() => onFilterChange({ category: null })}
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                selected={filters.category === category}
                onPress={() =>
                  onFilterChange({ category: filters.category === category ? null : category })
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.filterGroup}>
        <Text style={[styles.filterTitle, { color: colors.textFaint }]}>SORT BY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              selected={filters.sort === option.key}
              onPress={() => onFilterChange({ sort: option.key })}
            />
          ))}
        </ScrollView>
      </View>

      {filters.sort === 'smart' ? (
        <Text style={[styles.sortNote, { color: colors.textFaint }]}>
          Smart order blends priority, how soon a task starts and how close its deadline is.
        </Text>
      ) : null}
    </View>
  );
}

function Stat({
  value,
  label,
  color,
  muted,
}: {
  value: number;
  label: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.stat}>
      <AnimatedNumber value={value} style={[styles.statValue, { color }]} />
      <Text style={[styles.statLabel, { color: muted }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing(5),
    paddingBottom: spacing(2),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingBlock: {
    gap: spacing(0.5),
    flex: 1,
  },
  greeting: {
    ...typography.caption,
  },
  name: {
    ...typography.display,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 15,
  },
  signOut: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  signOutLabel: {
    ...typography.micro,
  },
  statCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing(5),
    gap: spacing(4),
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing(3),
  },
  percentBlock: {
    gap: spacing(0.5),
  },
  percent: {
    ...typography.display,
  },
  percentCaption: {
    ...typography.caption,
  },
  overdueBadge: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing(2),
  },
  overdueText: {
    ...typography.micro,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing(1),
  },
  statValue: {
    ...typography.title,
  },
  statLabel: {
    ...typography.micro,
  },
  divider: {
    width: 1,
    height: 26,
  },
  filterGroup: {
    gap: spacing(2),
  },
  filterTitle: {
    ...typography.micro,
  },
  chipRow: {
    gap: spacing(2),
    paddingRight: spacing(4),
  },
  sortNote: {
    ...typography.caption,
    marginTop: -spacing(2),
  },
});
