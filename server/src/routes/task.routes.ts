import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  taskStats,
  toggleSubtask,
  toggleTask,
  updateTask,
} from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTaskSchema, listTasksSchema, updateTaskSchema } from '../validators/task.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listTasksSchema, 'query'), asyncHandler(listTasks));
router.post('/', validate(createTaskSchema), asyncHandler(createTask));
router.get('/stats', asyncHandler(taskStats));
router.get('/:id', asyncHandler(getTask));
router.patch('/:id', validate(updateTaskSchema), asyncHandler(updateTask));
router.patch('/:id/toggle', asyncHandler(toggleTask));
router.patch('/:id/subtasks/:subtaskId/toggle', asyncHandler(toggleSubtask));
router.delete('/:id', asyncHandler(deleteTask));

export default router;
