import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, refreshSchema, registerSchema } from '../validators/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
router.post('/logout', requireAuth, validate(refreshSchema), asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
