import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.globalRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const parseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.parseRateLimit,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many parse requests. Please wait a moment.' },
});

export const holdLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.holdRateLimit,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many hold requests. Please wait a moment.' },
});
