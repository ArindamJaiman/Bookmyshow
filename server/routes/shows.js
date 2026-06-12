import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { parseLimiter } from '../middleware/rateLimiter.js';
import showParserService from '../services/ShowParserService.js';
import supabase from '../db/supabase.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/shows/parse
 * Parse a BookMyShow URL and return show details + seat layout.
 */
router.post('/parse', optionalAuth, parseLimiter, async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!showParserService.isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid BookMyShow URL' });
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('show_cache')
      .select('*')
      .eq('show_url', url)
      .single();

    // Use cache if less than 5 minutes old
    if (cached && Date.now() - new Date(cached.last_updated).getTime() < 5 * 60 * 1000) {
      logger.info('Returning cached show details', { url });
      return res.json({
        show: {
          movieName: cached.movie_name,
          venue: cached.venue,
          showDate: cached.show_date,
          url,
        },
        seatLayout: cached.seat_layout,
        availableSeats: cached.available_seats,
        cached: true,
      });
    }

    // Parse fresh
    const showDetails = await showParserService.parseShowUrl(url);
    const seatLayout = await showParserService.getSeatLayout(url);

    // Count available seats
    const availableSeats = [];
    if (seatLayout) {
      seatLayout.forEach((section) => {
        section.rows.forEach((row) => {
          row.seats.forEach((seat) => {
            if (seat.available && !seat.isAisle) {
              availableSeats.push(seat.id);
            }
          });
        });
      });
    }

    // Update cache
    await supabase.from('show_cache').upsert({
      show_url: url,
      movie_name: showDetails.movieName,
      venue: showDetails.venue,
      show_date: showDetails.showDate,
      seat_layout: seatLayout,
      available_seats: availableSeats,
      prices: {},
      last_updated: new Date().toISOString(),
    }).catch((err) => {
      logger.warn('Failed to update show cache', { error: err.message });
    });

    // Log audit
    if (req.user) {
      await supabase.from('audit_log').insert({
        user_id: req.user.id,
        action: 'parse_show',
        details: { url, movieName: showDetails.movieName },
        ip_address: req.ip,
      }).catch(() => {});
    }

    res.json({
      show: showDetails,
      seatLayout,
      availableSeats,
      cached: false,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shows/seats
 * Get current seat availability for a show URL.
 */
router.get('/seats', optionalAuth, async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }

    // Check cache
    const { data: cached } = await supabase
      .from('show_cache')
      .select('*')
      .eq('show_url', url)
      .single();

    if (cached) {
      return res.json({
        seatLayout: cached.seat_layout,
        availableSeats: cached.available_seats,
        lastUpdated: cached.last_updated,
      });
    }

    // Fetch fresh
    const seatLayout = await showParserService.getSeatLayout(url);
    res.json({ seatLayout, availableSeats: [], lastUpdated: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

export default router;
