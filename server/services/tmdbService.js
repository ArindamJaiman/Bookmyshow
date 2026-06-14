import { config } from '../config/env.js';
import logger from '../utils/logger.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
  // Evict old entries periodically
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.ts > CACHE_TTL) cache.delete(k);
    }
  }
}

async function tmdbFetch(path, params = {}) {
  const apiKey = config.tmdbApiKey;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured. Add it to your .env file.');
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }

  const cacheKey = url.toString();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error('TMDB API error', { status: res.status, path, body });
    throw new Error(`TMDB API error: ${res.status}`);
  }

  const data = await res.json();
  setCache(cacheKey, data);
  return data;
}

class TMDBService {
  /**
   * Get movies currently in theaters, filtered by region.
   */
  async getNowPlaying(page = 1, region = 'IN') {
    const data = await tmdbFetch('/movie/now_playing', {
      page,
      region,
      language: 'en-IN',
    });

    return {
      movies: data.results.map((m) => this.formatMovie(m)),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  }

  /**
   * Get popular movies (fallback if now_playing is sparse).
   */
  async getPopular(page = 1, region = 'IN') {
    const data = await tmdbFetch('/movie/popular', {
      page,
      region,
      language: 'en-IN',
    });

    return {
      movies: data.results.map((m) => this.formatMovie(m)),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  }

  /**
   * Get full movie details including runtime, genres, tagline.
   */
  async getMovieDetails(movieId) {
    const data = await tmdbFetch(`/movie/${movieId}`, {
      language: 'en-IN',
      append_to_response: 'credits,videos,release_dates',
    });

    // Extract India certification if available
    let certification = '';
    if (data.release_dates?.results) {
      const india = data.release_dates.results.find((r) => r.iso_3166_1 === 'IN');
      if (india?.release_dates?.[0]?.certification) {
        certification = india.release_dates[0].certification;
      }
    }

    // Extract cast (top 10)
    const cast = (data.credits?.cast || []).slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${IMG_BASE}/w185${c.profile_path}` : null,
    }));

    // Extract crew (director, writers)
    const director = (data.credits?.crew || []).find((c) => c.job === 'Director');
    const writers = (data.credits?.crew || [])
      .filter((c) => ['Writer', 'Screenplay', 'Story'].includes(c.job))
      .slice(0, 3);

    // Extract trailers
    const videos = (data.videos?.results || [])
      .filter((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
      .slice(0, 3)
      .map((v) => ({
        key: v.key,
        name: v.name,
        type: v.type,
      }));

    return {
      id: data.id,
      title: data.title,
      originalTitle: data.original_title,
      overview: data.overview,
      tagline: data.tagline,
      posterUrl: data.poster_path ? `${IMG_BASE}/w500${data.poster_path}` : null,
      backdropUrl: data.backdrop_path ? `${IMG_BASE}/w1280${data.backdrop_path}` : null,
      releaseDate: data.release_date,
      runtime: data.runtime,
      voteAverage: Math.round(data.vote_average * 10) / 10,
      voteCount: data.vote_count,
      genres: (data.genres || []).map((g) => g.name),
      language: data.original_language?.toUpperCase(),
      spokenLanguages: (data.spoken_languages || []).map((l) => l.english_name),
      certification,
      cast,
      director: director ? { id: director.id, name: director.name } : null,
      writers: writers.map((w) => ({ id: w.id, name: w.name, job: w.job })),
      videos,
      status: data.status,
    };
  }

  /**
   * Search movies by query.
   */
  async searchMovies(query, page = 1) {
    const data = await tmdbFetch('/search/movie', {
      query,
      page,
      region: 'IN',
      language: 'en-IN',
      include_adult: false,
    });

    return {
      movies: data.results.map((m) => this.formatMovie(m)),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  }

  /**
   * Format a TMDB movie result into our standard shape.
   */
  formatMovie(m) {
    return {
      id: m.id,
      title: m.title,
      originalTitle: m.original_title,
      overview: m.overview,
      posterUrl: m.poster_path ? `${IMG_BASE}/w500${m.poster_path}` : null,
      backdropUrl: m.backdrop_path ? `${IMG_BASE}/w780${m.backdrop_path}` : null,
      releaseDate: m.release_date,
      voteAverage: Math.round(m.vote_average * 10) / 10,
      voteCount: m.vote_count,
      language: m.original_language?.toUpperCase(),
      genreIds: m.genre_ids || [],
      popularity: m.popularity,
    };
  }
}

export default new TMDBService();
