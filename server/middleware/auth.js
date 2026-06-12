import { supabase } from '../db/supabase.js';
import logger from '../utils/logger.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Auth failed', { error: error?.message });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional auth — sets req.user if token present, doesn't block
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch {
      // Silently continue without auth
    }
  }
  next();
}
