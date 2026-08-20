export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ScorableTask {
  priority: Priority;
  dateTime: Date | string;
  deadline: Date | string | null;
  completed: boolean;
  createdAt?: Date | string;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  low: 0.15,
  medium: 0.4,
  high: 0.75,
  urgent: 1,
};

const WEIGHTS = {
  priority: 0.45,
  deadline: 0.4,
  schedule: 0.15,
};

const DEADLINE_HORIZON_HOURS = 72;
const SCHEDULE_HORIZON_HOURS = 24;
const OVERDUE_BASE = 1.5;
const MAX_OVERDUE_BONUS = 0.5;
const OVERDUE_RAMP_HOURS = 48;

const HOUR = 1000 * 60 * 60;

function hoursBetween(from: number, to: number): number {
  return (to - from) / HOUR;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function deadlineScore(deadline: number | null, now: number): number {
  if (deadline === null) return 0.2;

  const hoursLeft = hoursBetween(now, deadline);

  if (hoursLeft <= 0) {
    const overdueBy = Math.abs(hoursLeft);
    return OVERDUE_BASE + MAX_OVERDUE_BONUS * clamp01(overdueBy / OVERDUE_RAMP_HOURS);
  }

  return clamp01(1 - hoursLeft / DEADLINE_HORIZON_HOURS);
}

function scheduleScore(dateTime: number | null, now: number): number {
  if (dateTime === null) return 0;

  const hoursUntil = hoursBetween(now, dateTime);

  if (hoursUntil <= 0) return 1;

  return clamp01(1 - hoursUntil / SCHEDULE_HORIZON_HOURS);
}

export function scoreTask(task: ScorableTask, now: number = Date.now()): number {
  if (task.completed) return -1;

  const priority = PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.medium;
  const deadline = deadlineScore(toTime(task.deadline), now);
  const schedule = scheduleScore(toTime(task.dateTime), now);

  return (
    priority * WEIGHTS.priority + deadline * WEIGHTS.deadline + schedule * WEIGHTS.schedule
  );
}

export function compareBySmartScore<T extends ScorableTask>(a: T, b: T, now: number = Date.now()): number {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }

  const diff = scoreTask(b, now) - scoreTask(a, now);
  if (Math.abs(diff) > 1e-9) return diff;

  const aDeadline = toTime(a.deadline) ?? Number.POSITIVE_INFINITY;
  const bDeadline = toTime(b.deadline) ?? Number.POSITIVE_INFINITY;
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;

  const aCreated = toTime(a.createdAt ?? null) ?? 0;
  const bCreated = toTime(b.createdAt ?? null) ?? 0;
  return bCreated - aCreated;
}

export function sortTasksBySmartScore<T extends ScorableTask>(tasks: T[], now: number = Date.now()): T[] {
  return [...tasks].sort((a, b) => compareBySmartScore(a, b, now));
}
