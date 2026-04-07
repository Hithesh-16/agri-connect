// Re-export from canonical location for backward compatibility.
// New code should import from '../errors/app-error' and '../errors/error-handler'.
export { AppError } from '../errors/app-error';
export { errorHandler, notFoundHandler } from '../errors/error-handler';
