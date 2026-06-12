import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { config } from '../config/env.js';
import proxyRotator from '../utils/proxyRotator.js';

class SeatHoldService {
  constructor() {
    // Map<sessionId, { browser, page, seats, status, startTime, interval, showUrl }>
    this.sessions = new Map();
    this.eventListeners = new Map(); // sessionId -> callback

    // Periodic cleanup of expired sessions
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000);
  }

  /**
   * Start holding seats by launching a headless browser session.
   */
  async startHold(showUrl, seats, userId) {
    const sessionId = uuidv4();
    logger.info('Starting seat hold', { sessionId, showUrl, seats, userId });

    let browser;
    try {
      const launchOpts = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      };

      const proxy = proxyRotator.getNext();
      if (proxy) {
        launchOpts.args.push(`--proxy-server=${proxy}`);
      }

      browser = await puppeteer.launch(launchOpts);
      const page = await browser.newPage();

      await page.setUserAgent(config.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the show page
      await page.goto(showUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Attempt to select seats
      const selectResult = await this.selectSeats(page, seats);

      const session = {
        browser,
        page,
        seats,
        showUrl,
        userId,
        status: selectResult.success ? 'holding' : 'partial',
        selectedSeats: selectResult.selected,
        failedSeats: selectResult.failed,
        startTime: Date.now(),
        expiresAt: Date.now() + config.maxHoldTime,
        retryCount: 0,
        maxRetries: 3,
        interval: null,
      };

      this.sessions.set(sessionId, session);

      // Start monitoring loop
      session.interval = setInterval(() => this.monitorHold(sessionId), 30000);

      this.emit(sessionId, 'hold:started', {
        sessionId,
        seats: selectResult.selected,
        failedSeats: selectResult.failed,
        expiresAt: session.expiresAt,
      });

      logger.info('Seat hold started', {
        sessionId,
        selected: selectResult.selected.length,
        failed: selectResult.failed.length,
      });

      return {
        sessionId,
        status: session.status,
        selectedSeats: selectResult.selected,
        failedSeats: selectResult.failed,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      logger.error('Failed to start hold', { sessionId, error: error.message });
      if (browser) await browser.close();
      throw error;
    }
  }

  /**
   * Select seats on the BookMyShow page.
   */
  async selectSeats(page, seats) {
    const selected = [];
    const failed = [];

    for (const seatId of seats) {
      try {
        // Try multiple selector strategies
        const seatSelected = await page.evaluate((id) => {
          const selectors = [
            `[data-seat-id="${id}"]`,
            `[id="seat-${id}"]`,
            `.seat[data-id="${id}"]`,
            `td[data-seat="${id}"]`,
          ];

          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && !el.classList.contains('booked') && !el.classList.contains('sold')) {
              el.click();
              return true;
            }
          }
          return false;
        }, seatId);

        if (seatSelected) {
          selected.push(seatId);
          logger.debug(`Selected seat: ${seatId}`);
        } else {
          failed.push(seatId);
          logger.warn(`Could not select seat: ${seatId}`);
        }

        // Small delay between selections to appear human-like
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      } catch (error) {
        failed.push(seatId);
        logger.error(`Error selecting seat ${seatId}`, { error: error.message });
      }
    }

    return { success: failed.length === 0, selected, failed };
  }

  /**
   * Monitor a hold session — check if seats are still selected, re-select if needed.
   */
  async monitorHold(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Check if expired
    if (Date.now() >= session.expiresAt) {
      logger.info('Hold expired', { sessionId });
      await this.releaseHold(sessionId);
      this.emit(sessionId, 'hold:expired', { sessionId });
      return;
    }

    try {
      const page = session.page;

      // Check if page is still alive
      const isAlive = await page.evaluate(() => document.readyState).catch(() => null);

      if (!isAlive) {
        logger.warn('Page not responsive, attempting recovery', { sessionId });
        if (session.retryCount < session.maxRetries) {
          session.retryCount++;
          await page.goto(session.showUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await this.selectSeats(page, session.seats);
          this.emit(sessionId, 'hold:warning', {
            sessionId,
            message: 'Session recovered after page reload',
          });
        } else {
          session.status = 'failed';
          this.emit(sessionId, 'hold:failed', {
            sessionId,
            message: 'Max retries exceeded',
          });
          await this.releaseHold(sessionId);
        }
        return;
      }

      // Check if seats are still selected
      const seatStatus = await page.evaluate((seatIds) => {
        const status = {};
        for (const id of seatIds) {
          const selectors = [
            `[data-seat-id="${id}"]`,
            `[id="seat-${id}"]`,
            `.seat[data-id="${id}"]`,
          ];
          let found = false;
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
              status[id] = el.classList.contains('selected') || el.classList.contains('active');
              found = true;
              break;
            }
          }
          if (!found) status[id] = false;
        }
        return status;
      }, session.seats);

      // Re-select any deselected seats
      const deselected = Object.entries(seatStatus)
        .filter(([, isSelected]) => !isSelected)
        .map(([id]) => id);

      if (deselected.length > 0) {
        logger.warn('Seats deselected, re-selecting', { sessionId, deselected });
        await this.selectSeats(page, deselected);
        this.emit(sessionId, 'hold:warning', {
          sessionId,
          message: `Re-selected ${deselected.length} seats`,
          reselected: deselected,
        });
      }

      // Emit periodic status
      this.emit(sessionId, 'hold:status', {
        sessionId,
        status: session.status,
        seats: session.seats,
        timeRemaining: session.expiresAt - Date.now(),
      });
    } catch (error) {
      logger.error('Monitor error', { sessionId, error: error.message });
      session.retryCount++;
      if (session.retryCount >= session.maxRetries) {
        session.status = 'failed';
        this.emit(sessionId, 'hold:failed', {
          sessionId,
          message: `Monitoring failed: ${error.message}`,
        });
      }
    }
  }

  /**
   * Release a hold — deselect seats and close browser.
   */
  async releaseHold(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    logger.info('Releasing hold', { sessionId });

    if (session.interval) clearInterval(session.interval);

    try {
      // Try to deselect seats before closing
      if (session.page) {
        await session.page
          .evaluate((seatIds) => {
            for (const id of seatIds) {
              const selectors = [
                `[data-seat-id="${id}"]`,
                `[id="seat-${id}"]`,
                `.seat[data-id="${id}"]`,
              ];
              for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && (el.classList.contains('selected') || el.classList.contains('active'))) {
                  el.click(); // deselect
                  break;
                }
              }
            }
          }, session.seats)
          .catch(() => {});
      }
    } catch {
      // Ignore deselection errors
    }

    try {
      if (session.browser) await session.browser.close();
    } catch {
      // Ignore close errors
    }

    session.status = 'released';
    this.sessions.delete(sessionId);
    logger.info('Hold released', { sessionId });
  }

  /**
   * Extend a hold by 30 minutes (max once).
   */
  extendHold(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.extended) throw new Error('Hold already extended once');

    const extension = 30 * 60 * 1000; // 30 minutes
    session.expiresAt += extension;
    session.extended = true;

    this.emit(sessionId, 'hold:status', {
      sessionId,
      message: 'Hold extended by 30 minutes',
      expiresAt: session.expiresAt,
    });

    logger.info('Hold extended', { sessionId, newExpiry: new Date(session.expiresAt) });
    return { expiresAt: session.expiresAt };
  }

  /**
   * Get current status of a hold session.
   */
  getStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      status: session.status,
      seats: session.seats,
      selectedSeats: session.selectedSeats || session.seats,
      failedSeats: session.failedSeats || [],
      startTime: session.startTime,
      expiresAt: session.expiresAt,
      timeRemaining: Math.max(0, session.expiresAt - Date.now()),
      retryCount: session.retryCount,
      extended: !!session.extended,
    };
  }

  /**
   * Register an event listener for a session.
   */
  onEvent(sessionId, callback) {
    this.eventListeners.set(sessionId, callback);
  }

  removeListener(sessionId) {
    this.eventListeners.delete(sessionId);
  }

  emit(sessionId, event, data) {
    const callback = this.eventListeners.get(sessionId);
    if (callback) callback(event, data);
  }

  /**
   * Cleanup expired sessions.
   */
  async cleanupExpired() {
    for (const [sessionId, session] of this.sessions) {
      if (Date.now() >= session.expiresAt) {
        logger.info('Cleaning up expired session', { sessionId });
        await this.releaseHold(sessionId);
      }
    }
  }

  /**
   * Get all active sessions (for admin/debug).
   */
  getActiveSessions() {
    const active = [];
    for (const [sessionId, session] of this.sessions) {
      active.push({
        sessionId,
        userId: session.userId,
        status: session.status,
        seats: session.seats,
        timeRemaining: Math.max(0, session.expiresAt - Date.now()),
      });
    }
    return active;
  }

  /**
   * Shutdown — release all holds.
   */
  async shutdown() {
    clearInterval(this.cleanupInterval);
    for (const [sessionId] of this.sessions) {
      await this.releaseHold(sessionId);
    }
  }
}

export default new SeatHoldService();
