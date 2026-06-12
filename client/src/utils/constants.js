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
  HOLDS: {
    BASE: '/api/holds',
    BY_ID: (id) => `/api/holds/${id}`,
    CONFIRM: (id) => `/api/holds/${id}/confirm`,
    EXTEND: (id) => `/api/holds/${id}/extend`,
  },
};

export const MAX_HOLD_TIME = 2 * 60 * 60 * 1000; // 2 hours
export const MAX_SEATS = 10;
export const BOOKMYSHOW_URL_REGEX = /^https?:\/\/(in\.)?bookmyshow\.com\/.+/i;
