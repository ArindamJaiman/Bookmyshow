import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { config } from '../config/env.js';

class SessionManager {
  constructor() {
    // In-memory session store: Map<sessionId, sessionData>
    this.sessions = new Map();

    // Periodic cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Create a new session.
   */
  create(userId, data = {}) {
    const sessionId = uuidv4();
    const now = Date.now();
    const session = {
      id: sessionId,
      userId,
      ...data,
      createdAt: now,
      expiresAt: now + config.maxHoldTime,
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    logger.info('Session created', { sessionId, userId });
    return session;
  }

  /**
   * Get a session by ID.
   */
  get(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() >= session.expiresAt) {
      this.destroy(sessionId);
      return null;
    }
    return session;
  }

  /**
   * Get all sessions for a user.
   */
  getByUser(userId) {
    const userSessions = [];
    for (const [, session] of this.sessions) {
      if (session.userId === userId && Date.now() < session.expiresAt) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  /**
   * Check if user has an active hold.
   */
  hasActiveHold(userId) {
    for (const [, session] of this.sessions) {
      if (session.userId === userId && session.status === 'active' && Date.now() < session.expiresAt) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extend a session by 30 minutes.
   */
  extend(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.extended) throw new Error('Session already extended');

    session.expiresAt += 30 * 60 * 1000;
    session.extended = true;
    logger.info('Session extended', { sessionId });
    return session;
  }

  /**
   * Update session data.
   */
  update(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    Object.assign(session, data);
    return session;
  }

  /**
   * Destroy a session.
   */
  destroy(sessionId) {
    this.sessions.delete(sessionId);
    logger.info('Session destroyed', { sessionId });
  }

  /**
   * Cleanup expired sessions.
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (now >= session.expiresAt) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Shutdown — clear all sessions.
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

export default new SessionManager();
