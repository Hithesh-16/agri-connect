import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../config/logger';
import { Sentry } from '../config/sentry';
import { AppError, ValidationError } from './app-error';

const log = createChildLogger('error');

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    log.warn({ statusCode: err.statusCode, url: req.originalUrl }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof AppError) {
    log.warn({ statusCode: err.statusCode, url: req.originalUrl, method: req.method }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unhandled / non-operational error
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
