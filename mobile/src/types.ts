export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REPEATS = ['none', 'daily', 'weekly', 'monthly'] as const;
export type Repeat = (typeof REPEATS)[number];

export type TaskStatusFilter = 'all' | 'active' | 'completed';
export type SortMode = 'smart' | 'deadline' | 'priority' | 'dateTime' | 'created';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface SubtaskDraft {
  id?: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  user: string;
  title: string;
  description: string;
  dateTime: string;
  deadline: string | null;
  priority: Priority;
  repeat: Repeat;
  category: string;
  tags: string[];
  subtasks: Subtask[];
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  dateTime: string;
  deadline: string | null;
  priority: Priority;
  repeat: Repeat;
  category: string;
  tags: string[];
  subtasks: SubtaskDraft[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TaskFilters {
  status: TaskStatusFilter;
  priority: Priority | null;
  category: string | null;
  search: string;
  sort: SortMode;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  streak: number;
  trend: TrendPoint[];
  byPriority: Record<string, number>;
  byCategory: { category: string; count: number }[];
  categories: string[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  details?: { field: string; message: string }[];
}
