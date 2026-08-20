import { Priority } from '../types';

export interface ScorableTask {
  priority: Priority;
  dateTime: string;
  deadline: string | null;
  completed: boolean;
  createdAt?: string;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  low: 0.15,
  medium: 0.4,
  high: 0.75,
  urgent: 1,
};

const WEIGHTS = { priority: 0.45, deadline: 0.4, schedule: 0.15 };

const DEADLINE_HORIZON_HOURS = 72;
const SCHEDULE_HORIZON_HOURS = 24;
const OVERDUE_BASE = 1.5;
const MAX_OVERDUE_BONUS = 0.5;
const OVERDUE_RAMP_HOURS = 48;
const NO_DEADLINE_SCORE = 0.2;

const HOUR = 1000 * 60 * 60;

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function deadlineScore(deadline: number | null, now: number) {
  if (deadline === null) return NO_DEADLINE_SCORE;

  const hoursLeft = (deadline - now) / HOUR;

  if (hoursLeft <= 0) {
    return OVERDUE_BASE + MAX_OVERDUE_BONUS * clamp01(Math.abs(hoursLeft) / OVERDUE_RAMP_HOURS);
  }

  return clamp01(1 - hoursLeft / DEADLINE_HORIZON_HOURS);
}

function scheduleScore(dateTime: number | null, now: number) {
  if (dateTime === null) return 0;

  const hoursUntil = (dateTime - now) / HOUR;
  if (hoursUntil <= 0) return 1;

  return clamp01(1 - hoursUntil / SCHEDULE_HORIZON_HOURS);
}

export function scoreTask(task: ScorableTask, now: number = Date.now()): number {
  if (task.completed) return -1;

  return (
    (PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.medium) * WEIGHTS.priority +
    deadlineScore(toTime(task.deadline), now) * WEIGHTS.deadline +
    scheduleScore(toTime(task.dateTime), now) * WEIGHTS.schedule
  );
}

export function compareBySmartScore<T extends ScorableTask>(a: T, b: T, now = Date.now()): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;

  const diff = scoreTask(b, now) - scoreTask(a, now);
  if (Math.abs(diff) > 1e-9) return diff;

  const aDeadline = toTime(a.deadline) ?? Number.POSITIVE_INFINITY;
  const bDeadline = toTime(b.deadline) ?? Number.POSITIVE_INFINITY;
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;

  return (toTime(b.createdAt ?? null) ?? 0) - (toTime(a.createdAt ?? null) ?? 0);
}

export function sortTasks<T extends ScorableTask>(tasks: T[], now = Date.now()): T[] {
  return [...tasks].sort((a, b) => compareBySmartScore(a, b, now));
}

export function urgencyLabel(task: ScorableTask, now = Date.now()): string {
  const deadline = toTime(task.deadline);
  if (deadline === null) return 'No deadline';

  const hours = (deadline - now) / HOUR;

  if (hours <= 0) {
    const overdue = Math.abs(hours);
    if (overdue < 1) return 'Just missed';
    if (overdue < 24) return Math.round(overdue) + 'h overdue';
    return Math.round(overdue / 24) + 'd overdue';
  }

  if (hours < 1) return Math.max(1, Math.round(hours * 60)) + 'm left';
  if (hours < 24) return Math.round(hours) + 'h left';
  if (hours < 24 * 7) return Math.round(hours / 24) + 'd left';

  return Math.round(hours / 24 / 7) + 'w left';
}
