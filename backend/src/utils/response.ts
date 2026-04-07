import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: PaginationMeta,
  statusCode = 200,
): void {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) {
    body.pagination = meta;
  }
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, undefined, 201);
}

export function sendMessage(res: Response, message: string): void {
  res.json({ success: true, message });
}
