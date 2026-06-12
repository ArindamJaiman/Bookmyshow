import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { holdLimiter } from '../middleware/rateLimiter.js';
import seatHoldService from '../services/SeatHoldService.js';
import sessionManager from '../services/SessionManager.js';
import supabase from '../db/supabase.js';
import logger from '../utils/logger.js';
import { config } from '../config/env.js';

const router = Router();

// All hold routes require authentication
router.use(authMiddleware);

/**
 * POST /api/holds
 * Create a new seat hold.
 */
router.post('/', holdLimiter, async (req, res, next) => {
  try {
    const { showUrl, seats, movieName, venue, showTime } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!showUrl || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'showUrl and seats array are required' });
    }

    if (seats.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 seats per hold' });
    }

    // Check for existing active hold (max 1 per user)
    const { data: existingHolds } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'holding')
      .gt('hold_expiry', new Date().toISOString());

    if (existingHolds && existingHolds.length > 0) {
      return res.status(409).json({
        error: 'You already have an active hold. Cancel it first to create a new one.',
        existingHoldId: existingHolds[0].id,
      });
    }

    const holdExpiry = new Date(Date.now() + config.maxHoldTime).toISOString();

    // Start the Puppeteer hold
    const holdResult = await seatHoldService.startHold(showUrl, seats, userId);

    // Save reservation to database
    const { data: reservation, error: dbError } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        show_url: showUrl,
        movie_name: movieName || 'Unknown Movie',
        venue: venue || 'Unknown Venue',
        show_time: showTime || null,
        seats,
        hold_expiry: holdExpiry,
        status: holdResult.status === 'holding' ? 'holding' : 'holding',
        browser_session_id: holdResult.sessionId,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to save reservation', { error: dbError.message });
      await seatHoldService.releaseHold(holdResult.sessionId);
      return res.status(500).json({ error: 'Failed to create reservation' });
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: userId,
      reservation_id: reservation.id,
      action: 'hold_created',
      details: { seats, showUrl, sessionId: holdResult.sessionId },
      ip_address: req.ip,
    }).catch(() => {});

    logger.info('Hold created', {
      reservationId: reservation.id,
      sessionId: holdResult.sessionId,
      seats,
    });

    res.status(201).json({
      reservation,
      hold: holdResult,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/holds
 * List all holds for the current user.
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch holds' });
    }

    // Enrich with live status from SeatHoldService
    const enriched = reservations.map((r) => {
      const liveStatus = r.browser_session_id
        ? seatHoldService.getStatus(r.browser_session_id)
        : null;

      return {
        ...r,
        liveStatus,
        isActive: r.status === 'holding' && new Date(r.hold_expiry) > new Date(),
        timeRemaining: Math.max(0, new Date(r.hold_expiry) - Date.now()),
      };
    });

    res.json({ reservations: enriched });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/holds/:id
 * Get details of a specific hold.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !reservation) {
      return res.status(404).json({ error: 'Hold not found' });
    }

    const liveStatus = reservation.browser_session_id
      ? seatHoldService.getStatus(reservation.browser_session_id)
      : null;

    res.json({
      reservation,
      liveStatus,
      isActive: reservation.status === 'holding' && new Date(reservation.hold_expiry) > new Date(),
      timeRemaining: Math.max(0, new Date(reservation.hold_expiry) - Date.now()),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/holds/:id
 * Cancel a hold and release seats.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !reservation) {
      return res.status(404).json({ error: 'Hold not found' });
    }

    // Release browser session
    if (reservation.browser_session_id) {
      await seatHoldService.releaseHold(reservation.browser_session_id);
    }

    // Update database
    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: userId,
      reservation_id: id,
      action: 'hold_cancelled',
      details: { seats: reservation.seats },
      ip_address: req.ip,
    }).catch(() => {});

    logger.info('Hold cancelled', { reservationId: id, userId });
    res.json({ message: 'Hold cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/holds/:id/confirm
 * Confirm a hold — redirect to BookMyShow payment.
 */
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'holding')
      .single();

    if (error || !reservation) {
      return res.status(404).json({ error: 'Active hold not found' });
    }

    // Update status to confirmed
    await supabase
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', id);

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: userId,
      reservation_id: id,
      action: 'hold_confirmed',
      details: { seats: reservation.seats },
      ip_address: req.ip,
    }).catch(() => {});

    // The browser session stays active so user can proceed to payment
    // on the already-loaded page
    res.json({
      message: 'Hold confirmed. Proceed to payment on BookMyShow.',
      paymentUrl: reservation.show_url,
      seats: reservation.seats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/holds/:id/extend
 * Extend a hold by 30 minutes (max once).
 */
router.post('/:id/extend', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'holding')
      .single();

    if (error || !reservation) {
      return res.status(404).json({ error: 'Active hold not found' });
    }

    if (reservation.extended) {
      return res.status(400).json({ error: 'Hold has already been extended' });
    }

    const newExpiry = new Date(new Date(reservation.hold_expiry).getTime() + 30 * 60 * 1000);

    // Extend browser session
    if (reservation.browser_session_id) {
      seatHoldService.extendHold(reservation.browser_session_id);
    }

    // Update database
    await supabase
      .from('reservations')
      .update({
        hold_expiry: newExpiry.toISOString(),
        extended: true,
      })
      .eq('id', id);

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: userId,
      reservation_id: id,
      action: 'hold_extended',
      details: { newExpiry: newExpiry.toISOString() },
      ip_address: req.ip,
    }).catch(() => {});

    logger.info('Hold extended', { reservationId: id, newExpiry });
    res.json({ message: 'Hold extended by 30 minutes', newExpiry });
  } catch (err) {
    next(err);
  }
});

export default router;
