export const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  HELD_YOURS: 'held-yours',
  HELD_OTHERS: 'held-others',
  BOOKED: 'booked',
  AISLE: 'aisle',
};

export const HOLD_STATUS = {
  HOLDING: 'holding',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  SHOWS: {
    PARSE: '/api/shows/parse',
    SEATS: '/api/shows/seats',
  },
  MOVIES: {
    NOW_PLAYING: '/api/movies/now-playing',
    SEARCH: '/api/movies/search',
    CITIES: '/api/movies/cities',
    DATES: '/api/movies/dates',
    DETAIL: (id) => `/api/movies/${id}`,
    VENUES: (id) => `/api/movies/${id}/venues`,
    SEATS: (id) => `/api/movies/${id}/seats`,
  },
  HOLDS: {
    BASE: '/api/holds',
    BY_ID: (id) => `/api/holds/${id}`,
    CONFIRM: (id) => `/api/holds/${id}/confirm`,
    EXTEND: (id) => `/api/holds/${id}/extend`,
  },
};

export const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

export const MAX_HOLD_TIME = 2 * 60 * 1000; // 2 hours
export const MAX_SEATS = 10;
export const BOOKMYSHOW_URL_REGEX = /^https?:\/\/(in\.)?bookmyshow\.com\/.+/i;

