import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  const anyErr = err as { code?: number; name?: string; message?: string; stack?: string };

  if (anyErr?.code === 11000) {
    res.status(409).json({ success: false, message: 'That record already exists' });
    return;
  }

  if (anyErr?.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Malformed identifier' });
    return;
  }

  console.error('[error]', anyErr?.stack ?? err);

  res.status(500).json({
    success: false,
    message: 'Something went wrong on our end',
    ...(isProduction ? {} : { debug: anyErr?.message }),
  });
}
