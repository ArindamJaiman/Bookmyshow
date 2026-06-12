import logger from '../utils/logger.js';
import supabase from '../db/supabase.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error('Unhandled error', {
    error: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Log to audit table for server errors
  if (statusCode >= 500 && req.user) {
    supabase
      .from('audit_log')
      .insert({
        user_id: req.user.id,
        action: 'server_error',
        details: { path: req.path, error: message },
        ip_address: req.ip,
      })
      .then(() => {})
      .catch(() => {});
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
