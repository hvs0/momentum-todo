import mongoose, { Document, Model, Schema } from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REPEATS = ['none', 'daily', 'weekly', 'monthly'] as const;
export type Repeat = (typeof REPEATS)[number];

export interface ISubtask {
  _id: mongoose.Types.ObjectId;
  title: string;
  done: boolean;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dateTime: Date;
  deadline: Date | null;
  priority: Priority;
  repeat: Repeat;
  category: string;
  tags: string[];
  subtasks: mongoose.Types.DocumentArray<ISubtask & mongoose.Types.Subdocument>;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    done: { type: Boolean, default: false },
  },
  {
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

const taskSchema = new Schema<ITask>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    dateTime: { type: Date, required: true, default: Date.now },
    deadline: { type: Date, default: null },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },
    repeat: { type: String, enum: REPEATS, default: 'none' },
    category: { type: String, default: 'General', trim: true, maxlength: 40 },
    tags: { type: [String], default: [] },
    subtasks: { type: [subtaskSchema], default: [] },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

taskSchema.index({ user: 1, completed: 1, deadline: 1 });

taskSchema.pre('save', function stampCompletion(next) {
  if (this.isModified('completed')) {
    this.completedAt = this.completed ? new Date() : null;
  }
  next();
});

export function shiftForRepeat(date: Date, repeat: Repeat): Date {
  const next = new Date(date);

  switch (repeat) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      break;
  }

  return next;
}

export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
