import { api } from './client';
import { ApiEnvelope, Task, TaskDraft, TaskFilters, TaskStats } from '../types';

function toQuery(filters: Partial<TaskFilters>): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.status && filters.status !== 'all') params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.category) params.category = filters.category;
  if (filters.search) params.search = filters.search;
  if (filters.sort) params.sort = filters.sort;

  return params;
}

export async function fetchTasksRequest(filters: Partial<TaskFilters>): Promise<Task[]> {
  const { data } = await api.get<ApiEnvelope<{ tasks: Task[]; count: number }>>('/tasks', {
    params: toQuery(filters),
  });
  return data.data.tasks;
}

export async function createTaskRequest(draft: TaskDraft): Promise<Task> {
  const { data } = await api.post<ApiEnvelope<{ task: Task }>>('/tasks', draft);
  return data.data.task;
}

export async function updateTaskRequest(id: string, patch: Partial<TaskDraft>): Promise<Task> {
  const { data } = await api.patch<ApiEnvelope<{ task: Task }>>('/tasks/' + id, patch);
  return data.data.task;
}

export async function toggleTaskRequest(
  id: string,
): Promise<{ task: Task; nextOccurrence: Task | null }> {
  const { data } = await api.patch<ApiEnvelope<{ task: Task; nextOccurrence: Task | null }>>(
    '/tasks/' + id + '/toggle',
  );
  return data.data;
}

export async function toggleSubtaskRequest(taskId: string, subtaskId: string): Promise<Task> {
  const { data } = await api.patch<ApiEnvelope<{ task: Task }>>(
    '/tasks/' + taskId + '/subtasks/' + subtaskId + '/toggle',
  );
  return data.data.task;
}

export async function deleteTaskRequest(id: string): Promise<string> {
  const { data } = await api.delete<ApiEnvelope<{ id: string }>>('/tasks/' + id);
  return data.data.id;
}

export async function fetchStatsRequest(): Promise<TaskStats> {
  const { data } = await api.get<ApiEnvelope<TaskStats>>('/tasks/stats');
  return data.data;
}
