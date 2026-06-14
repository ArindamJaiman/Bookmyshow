import { Router } from 'express';
import tmdbService from '../services/tmdbService.js';
import venueService from '../services/venueService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/movies/cities
 * Get list of available cities.
 */
router.get('/cities', (req, res) => {
  res.json({ cities: venueService.getCities() });
});

/**
 * GET /api/movies/dates
 * Get available dates for booking.
 */
router.get('/dates', (req, res) => {
  res.json({ dates: venueService.getAvailableDates() });
});

/**
 * GET /api/movies/now-playing
 * List movies currently in theaters.
 */
router.get('/now-playing', async (req, res, next) => {
  try {
    const { page = 1, region = 'IN' } = req.query;
    const data = await tmdbService.getNowPlaying(parseInt(page, 10), region);

    // If now_playing returns too few, supplement with popular
    if (data.movies.length < 5) {
      const popular = await tmdbService.getPopular(1, region);
      const existingIds = new Set(data.movies.map((m) => m.id));
      const extra = popular.movies.filter((m) => !existingIds.has(m.id));
      data.movies = [...data.movies, ...extra].slice(0, 20);
    }

    res.json(data);
  } catch (err) {
    logger.error('Failed to fetch now playing', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/movies/search
 * Search movies by query.
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const data = await tmdbService.searchMovies(q.trim(), parseInt(page, 10));
    res.json(data);
  } catch (err) {
    logger.error('Failed to search movies', { error: err.message });
    next(err);
  }
});

/**
 * GET /api/movies/:id
 * Get full movie details.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await tmdbService.getMovieDetails(parseInt(id, 10));
    res.json({ movie });
  } catch (err) {
    logger.error('Failed to fetch movie details', { movieId: req.params.id, error: err.message });
    next(err);
  }
});

/**
 * GET /api/movies/:id/venues
 * Get venues and showtimes for a movie in a specific city.
 */
router.get('/:id/venues', (req, res, next) => {
  try {
    const { id } = req.params;
    const { city = 'mumbai', date } = req.query;

    const selectedDate = date || new Date().toISOString().split('T')[0];
    const venues = venueService.getVenuesForMovie(parseInt(id, 10), city, selectedDate);
    const dates = venueService.getAvailableDates();

    res.json({ venues, dates, city, date: selectedDate });
  } catch (err) {
    logger.error('Failed to fetch venues', { movieId: req.params.id, error: err.message });
    next(err);
  }
});

/**
 * GET /api/movies/:id/seats
 * Get seat layout for a specific venue + showtime.
 */
router.get('/:id/seats', (req, res, next) => {
  try {
    const { venueId, showtimeId } = req.query;
    if (!venueId || !showtimeId) {
      return res.status(400).json({ error: 'venueId and showtimeId are required' });
    }

    const seatLayout = venueService.generateSeatLayout(venueId, showtimeId);

    // Count available seats
    const availableSeats = [];
    seatLayout.forEach((section) => {
      section.rows.forEach((row) => {
        row.seats.forEach((seat) => {
          if (seat.available && !seat.isAisle) {
            availableSeats.push(seat.id);
          }
        });
      });
    });

    res.json({ seatLayout, availableSeats });
  } catch (err) {
    logger.error('Failed to generate seats', { error: err.message });
    next(err);
  }
});

export default router;
