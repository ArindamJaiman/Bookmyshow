import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',

  // TMDB
  tmdbApiKey: process.env.TMDB_API_KEY || '',

  // BookMyShow automation
  userAgent:
    process.env.BOOKMYSHOW_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  proxyList: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
  maxHoldTime: parseInt(process.env.MAX_HOLD_TIME || '7200000', 10), // 2 hours

  // Rate limits
  globalRateLimit: 100, // per minute per IP
  parseRateLimit: 5,
  holdRateLimit: 2,
};
