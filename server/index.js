import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { config } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupWebSocket } from './websocket/seatStatus.js';
import authRoutes from './routes/auth.js';
import showRoutes from './routes/shows.js';
import holdRoutes from './routes/holds.js';
import seatHoldService from './services/SeatHoldService.js';
import sessionManager from './services/SessionManager.js';
import logger from './utils/logger.js';

const app = express();

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(globalLimiter);

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/holds', holdRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: seatHoldService.getActiveSessions().length,
  });
});

// Error handler
app.use(errorHandler);

// Create HTTP server and attach WebSocket
const server = http.createServer(app);
setupWebSocket(server);

// Start server
server.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`, { env: config.nodeEnv });
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  await seatHoldService.shutdown();
  sessionManager.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
