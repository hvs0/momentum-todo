import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { Task } from '../../types';
import { sortTasks } from '../../utils/priority';

const selectItems = (state: RootState) => state.tasks.items;
const selectFilters = (state: RootState) => state.tasks.filters;

export const selectVisibleTasks = createSelector([selectItems, selectFilters], (items, filters) => {
  const search = filters.search.trim().toLowerCase();

  const filtered = items.filter((task) => {
    if (filters.status === 'active' && task.completed) return false;
    if (filters.status === 'completed' && !task.completed) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.category && task.category !== filters.category) return false;

    if (search) {
      const haystack = (task.title + ' ' + task.description + ' ' + task.tags.join(' ')).toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  if (filters.sort === 'smart') return sortTasks(filtered);

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'deadline': {
        const left = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const right = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return left - right;
      }
      case 'priority': {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      case 'dateTime':
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
});

export const selectCategories = createSelector([selectItems], (items) => {
  const seen = new Set<string>();
  items.forEach((task) => seen.add(task.category));
  return Array.from(seen).sort();
});

export const selectProgress = createSelector([selectItems], (items) => {
  const total = items.length;
  const done = items.filter((task) => task.completed).length;
  const overdue = items.filter(
    (task) => !task.completed && task.deadline && new Date(task.deadline).getTime() < Date.now(),
  ).length;

  return {
    total,
    done,
    active: total - done,
    overdue,
    ratio: total === 0 ? 0 : done / total,
  };
});

export const selectTaskById = (id: string | undefined) => (state: RootState): Task | undefined =>
  id ? state.tasks.items.find((task) => task.id === id) : undefined;
