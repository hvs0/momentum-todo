import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { readErrorMessage } from '../../api/client';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchStatsRequest,
  fetchTasksRequest,
  toggleSubtaskRequest,
  toggleTaskRequest,
  updateTaskRequest,
} from '../../api/tasks';
import { Task, TaskDraft, TaskFilters, TaskStats } from '../../types';
import { logout } from '../auth/authSlice';

interface TasksState {
  items: Task[];
  stats: TaskStats | null;
  filters: TaskFilters;
  loading: boolean;
  refreshing: boolean;
  saving: boolean;
  busyIds: string[];
  error: string | null;
  lastSpawned: Task | null;
}

const initialFilters: TaskFilters = {
  status: 'all',
  priority: null,
  category: null,
  search: '',
  sort: 'smart',
};

const initialState: TasksState = {
  items: [],
  stats: null,
  filters: initialFilters,
  loading: false,
  refreshing: false,
  saving: false,
  busyIds: [],
  error: null,
  lastSpawned: null,
};

export const fetchTasks = createAsyncThunk<
  Task[],
  { refreshing?: boolean } | undefined,
  { rejectValue: string }
>('tasks/fetch', async (_arg, { rejectWithValue }) => {
  try {
    return await fetchTasksRequest({});
  } catch (error) {
    return rejectWithValue(readErrorMessage(error, 'Could not load your tasks'));
  }
});

export const fetchStats = createAsyncThunk<TaskStats, void, { rejectValue: string }>(
  'tasks/stats',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchStatsRequest();
    } catch (error) {
      return rejectWithValue(readErrorMessage(error));
    }
  },
);

export const createTask = createAsyncThunk<Task, TaskDraft, { rejectValue: string }>(
  'tasks/create',
  async (draft, { rejectWithValue, dispatch }) => {
    try {
      const task = await createTaskRequest(draft);
      dispatch(fetchStats());
      return task;
    } catch (error) {
      return rejectWithValue(readErrorMessage(error, 'Could not save the task'));
    }
  },
);

export const updateTask = createAsyncThunk<
  Task,
  { id: string; patch: Partial<TaskDraft> },
  { rejectValue: string }
>('tasks/update', async ({ id, patch }, { rejectWithValue, dispatch }) => {
  try {
    const task = await updateTaskRequest(id, patch);
    dispatch(fetchStats());
    return task;
  } catch (error) {
    return rejectWithValue(readErrorMessage(error, 'Could not update the task'));
  }
});

export const toggleTask = createAsyncThunk<
  { task: Task; nextOccurrence: Task | null },
  string,
  { rejectValue: string }
>('tasks/toggle', async (id, { rejectWithValue, dispatch }) => {
  try {
    const result = await toggleTaskRequest(id);
    dispatch(fetchStats());
    return result;
  } catch (error) {
    return rejectWithValue(readErrorMessage(error, 'Could not update the task'));
  }
});

export const toggleSubtask = createAsyncThunk<
  Task,
  { taskId: string; subtaskId: string },
  { rejectValue: string }
>('tasks/toggleSubtask', async ({ taskId, subtaskId }, { rejectWithValue }) => {
  try {
    return await toggleSubtaskRequest(taskId, subtaskId);
  } catch (error) {
    return rejectWithValue(readErrorMessage(error, 'Could not update the checklist'));
  }
});

export const deleteTask = createAsyncThunk<string, string, { rejectValue: string }>(
  'tasks/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const removed = await deleteTaskRequest(id);
      dispatch(fetchStats());
      return removed;
    } catch (error) {
      return rejectWithValue(readErrorMessage(error, 'Could not delete the task'));
    }
  },
);

function replaceTask(items: Task[], task: Task) {
  const index = items.findIndex((item) => item.id === task.id);
  if (index >= 0) items[index] = task;
  else items.unshift(task);
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    filtersChanged(state, action: PayloadAction<Partial<TaskFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    filtersReset(state) {
      state.filters = initialFilters;
    },
    errorCleared(state) {
      state.error = null;
    },
    spawnAcknowledged(state) {
      state.lastSpawned = null;
    },
    optimisticToggle(state, action: PayloadAction<string>) {
      const task = state.items.find((item) => item.id === action.payload);
      if (!task) return;

      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
    },
    optimisticSubtaskToggle(
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string }>,
    ) {
      const task = state.items.find((item) => item.id === action.payload.taskId);
      const subtask = task?.subtasks.find((item) => item.id === action.payload.subtaskId);
      if (subtask) subtask.done = !subtask.done;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        if (action.meta.arg?.refreshing) state.refreshing = true;
        else state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload ?? 'Could not load your tasks';
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(toggleTask.pending, (state, action) => {
        state.busyIds.push(action.meta.arg);
      })
      .addCase(toggleTask.fulfilled, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.meta.arg);
        replaceTask(state.items, action.payload.task);

        if (action.payload.nextOccurrence) {
          replaceTask(state.items, action.payload.nextOccurrence);
          state.lastSpawned = action.payload.nextOccurrence;
        }
      })
      .addCase(toggleTask.rejected, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.meta.arg);
        state.error = action.payload ?? 'Could not update the task';

        const task = state.items.find((item) => item.id === action.meta.arg);
        if (task) {
          task.completed = !task.completed;
          task.completedAt = task.completed ? new Date().toISOString() : null;
        }
      })
      .addCase(toggleSubtask.fulfilled, (state, action) => {
        replaceTask(state.items, action.payload);
      })
      .addCase(toggleSubtask.rejected, (state, action) => {
        state.error = action.payload ?? 'Could not update the checklist';

        const task = state.items.find((item) => item.id === action.meta.arg.taskId);
        const subtask = task?.subtasks.find((item) => item.id === action.meta.arg.subtaskId);
        if (subtask) subtask.done = !subtask.done;
      })
      .addCase(deleteTask.pending, (state, action) => {
        state.busyIds.push(action.meta.arg);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.meta.arg);
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.busyIds = state.busyIds.filter((id) => id !== action.meta.arg);
        state.error = action.payload ?? 'Could not delete the task';
      })
      .addCase(logout.fulfilled, () => initialState);

    for (const thunk of [createTask, updateTask]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.saving = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.saving = false;
          replaceTask(state.items, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.saving = false;
          state.error = action.payload ?? 'Could not save the task';
        });
    }
  },
});

export const {
  filtersChanged,
  filtersReset,
  errorCleared,
  spawnAcknowledged,
  optimisticToggle,
  optimisticSubtaskToggle,
} = tasksSlice.actions;

export default tasksSlice.reducer;
