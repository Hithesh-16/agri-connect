import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('http');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      log.error(logData, 'request failed');
    } else if (res.statusCode >= 400) {
      log.warn(logData, 'request error');
    } else {
      log.info(logData, 'request completed');
    }
  });

  next();
}
