import { z } from 'zod';
import { PRIORITIES, REPEATS } from '../models/Task';

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .transform((value) => new Date(value));

const subtask = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Subtask needs a title').max(120),
  done: z.boolean().optional().default(false),
});

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120),
    description: z.string().trim().max(2000).optional().default(''),
    dateTime: isoDate.optional(),
    deadline: isoDate.nullable().optional(),
    priority: z.enum(PRIORITIES).optional().default('medium'),
    repeat: z.enum(REPEATS).optional().default('none'),
    category: z.string().trim().max(40).optional().default('General'),
    tags: z.array(z.string().trim().min(1).max(24)).max(10).optional().default([]),
    subtasks: z.array(subtask).max(20).optional().default([]),
    completed: z.boolean().optional().default(false),
  })
  .refine((data) => !data.deadline || !data.dateTime || data.deadline >= data.dateTime, {
    message: 'Deadline cannot be earlier than the start time',
    path: ['deadline'],
  });

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    dateTime: isoDate.optional(),
    deadline: isoDate.nullable().optional(),
    priority: z.enum(PRIORITIES).optional(),
    repeat: z.enum(REPEATS).optional(),
    category: z.string().trim().max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(24)).max(10).optional(),
    subtasks: z.array(subtask).max(20).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export const listTasksSchema = z.object({
  status: z.enum(['all', 'active', 'completed']).optional().default('all'),
  priority: z.enum(PRIORITIES).optional(),
  category: z.string().trim().max(40).optional(),
  tag: z.string().trim().max(24).optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(['smart', 'deadline', 'created', 'priority', 'dateTime']).optional().default('smart'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksSchema>;
