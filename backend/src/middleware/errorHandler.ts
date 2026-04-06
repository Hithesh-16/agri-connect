import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../config/logger';
import { Sentry } from '../config/sentry';

const log = createChildLogger('error');

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    log.warn({ statusCode: err.statusCode, url: req.originalUrl, method: req.method }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  log.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');
  Sentry.captureException(err);

  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
  });
}
