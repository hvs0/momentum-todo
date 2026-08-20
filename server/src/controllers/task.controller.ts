import { Request, Response } from 'express';
import { FilterQuery, Types } from 'mongoose';
import { ITask, shiftForRepeat, Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { sortTasksBySmartScore } from '../utils/priority';
import { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../validators/task.schema';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const TREND_DAYS = 7;

function ownerId(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw ApiError.unauthorized();
  return id;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export async function listTasks(req: Request, res: Response) {
  const query = ((req as Request & { validatedQuery?: ListTasksQuery }).validatedQuery ??
    req.query) as ListTasksQuery;

  const filter: FilterQuery<ITask> = { user: ownerId(req) };

  if (query.status === 'active') filter.completed = false;
  if (query.status === 'completed') filter.completed = true;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = query.tag;

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const found = await Task.find(filter).lean();

  const tasks = found.map((doc) => {
    const { _id, __v, user, subtasks, ...rest } = doc as typeof doc & { __v?: number };
    return {
      id: String(_id),
      user: String(user),
      subtasks: ((subtasks ?? []) as unknown as { _id: unknown; title: string; done: boolean }[]).map(
        (item) => ({ id: String(item._id), title: item.title, done: item.done }),
      ),
      ...rest,
    };
  });

  switch (query.sort) {
    case 'deadline':
      tasks.sort((a, b) => {
        const left = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const right = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return left - right;
      });
      break;
    case 'priority':
      tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      break;
    case 'dateTime':
      tasks.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      break;
    case 'created':
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    default:
      tasks.splice(0, tasks.length, ...sortTasksBySmartScore(tasks));
  }

  res.json({ success: true, data: { tasks, count: tasks.length } });
}

export async function createTask(req: Request, res: Response) {
  const body = req.body as CreateTaskInput;

  const task = await Task.create({
    ...body,
    dateTime: body.dateTime ?? new Date(),
    user: ownerId(req),
  });

  res.status(201).json({ success: true, data: { task: task.toJSON() } });
}

export async function getTask(req: Request, res: Response) {
  const task = await Task.findOne({ _id: req.params.id, user: ownerId(req) });
  if (!task) throw ApiError.notFound('Task not found');

  res.json({ success: true, data: { task: task.toJSON() } });
}

export async function updateTask(req: Request, res: Response) {
  const body = req.body as UpdateTaskInput;

  const task = await Task.findOne({ _id: req.params.id, user: ownerId(req) });
  if (!task) throw ApiError.notFound('Task not found');

  const { subtasks, ...rest } = body;
  Object.assign(task, rest);

  if (subtasks) {
    task.set(
      'subtasks',
      subtasks.map((item) => ({ title: item.title, done: item.done ?? false })),
    );
  }

  await task.save();

  res.json({ success: true, data: { task: task.toJSON() } });
}

export async function toggleTask(req: Request, res: Response) {
  const user = ownerId(req);

  const task = await Task.findOne({ _id: req.params.id, user });
  if (!task) throw ApiError.notFound('Task not found');

  task.completed = !task.completed;
  await task.save();

  let nextOccurrence = null;

  if (task.completed && task.repeat !== 'none') {
    const created = await Task.create({
      user,
      title: task.title,
      description: task.description,
      dateTime: shiftForRepeat(task.dateTime, task.repeat),
      deadline: task.deadline ? shiftForRepeat(task.deadline, task.repeat) : null,
      priority: task.priority,
      repeat: task.repeat,
      category: task.category,
      tags: task.tags,
      subtasks: task.subtasks.map((item) => ({ title: item.title, done: false })),
      completed: false,
    });

    nextOccurrence = created.toJSON();
  }

  res.json({ success: true, data: { task: task.toJSON(), nextOccurrence } });
}

export async function toggleSubtask(req: Request, res: Response) {
  const task = await Task.findOne({ _id: req.params.id, user: ownerId(req) });
  if (!task) throw ApiError.notFound('Task not found');

  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) throw ApiError.notFound('Subtask not found');

  subtask.done = !subtask.done;
  await task.save();

  res.json({ success: true, data: { task: task.toJSON() } });
}

export async function deleteTask(req: Request, res: Response) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: ownerId(req) });
  if (!task) throw ApiError.notFound('Task not found');

  res.json({ success: true, data: { id: req.params.id } });
}

export async function taskStats(req: Request, res: Response) {
  const user = ownerId(req);
  const now = new Date();

  const [total, completed, overdue, byPriority, categories, completions] = await Promise.all([
    Task.countDocuments({ user }),
    Task.countDocuments({ user, completed: true }),
    Task.countDocuments({ user, completed: false, deadline: { $ne: null, $lt: now } }),
    Task.aggregate<{ _id: string; count: number }>([
      { $match: { user: new Types.ObjectId(user) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.aggregate<{ _id: string; count: number }>([
      { $match: { user: new Types.ObjectId(user) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Task.find({ user, completed: true, completedAt: { $ne: null } })
      .select('completedAt')
      .lean(),
  ]);

  const completedDays = new Set(
    completions.map((entry) => dayKey(new Date(entry.completedAt as unknown as string))),
  );

  const trend: { date: string; count: number }[] = [];
  for (let offset = TREND_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const key = dayKey(day);
    const count = completions.filter(
      (entry) => dayKey(new Date(entry.completedAt as unknown as string)) === key,
    ).length;
    trend.push({ date: key, count });
  }

  let streak = 0;
  const cursor = new Date(now);
  if (!completedDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completedDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  res.json({
    success: true,
    data: {
      total,
      completed,
      active: total - completed,
      overdue,
      streak,
      trend,
      byPriority: byPriority.reduce<Record<string, number>>((acc, row) => {
        acc[row._id] = row.count;
        return acc;
      }, {}),
      byCategory: categories.map((row) => ({ category: row._id, count: row.count })),
      categories: categories.map((row) => row._id),
    },
  });
}
