import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client (uses anon key, respects RLS)
const supabasePublic = createClient(config.supabaseUrl, config.supabaseAnonKey);

export { supabase, supabasePublic };
export default supabase;
