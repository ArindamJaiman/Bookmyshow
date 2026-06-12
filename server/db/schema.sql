-- ============================================
-- BookMyShow Seat Hold System — Database Schema
-- Target: Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users table (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  display_name VARCHAR(100),
  max_active_holds INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Reservations table
-- ============================================
CREATE TYPE reservation_status AS ENUM ('holding', 'confirmed', 'expired', 'cancelled', 'failed');

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  show_url TEXT NOT NULL,
  movie_name VARCHAR(255),
  venue VARCHAR(255),
  show_time TIMESTAMPTZ,
  seats JSONB NOT NULL DEFAULT '[]'::jsonb,
  hold_expiry TIMESTAMPTZ NOT NULL,
  status reservation_status DEFAULT 'holding',
  browser_session_id VARCHAR(100),
  error_message TEXT,
  extended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding active/expired holds efficiently
CREATE INDEX idx_reservations_status_expiry ON public.reservations(status, hold_expiry);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);

-- ============================================
-- Show Cache table
-- ============================================
CREATE TABLE IF NOT EXISTS public.show_cache (
  show_url TEXT PRIMARY KEY,
  movie_name VARCHAR(255),
  venue VARCHAR(255),
  show_date TIMESTAMPTZ,
  seat_layout JSONB DEFAULT '{}'::jsonb,
  available_seats JSONB DEFAULT '[]'::jsonb,
  prices JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Audit Log table
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_reservation ON public.audit_log(reservation_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Reservations: users can CRUD their own
CREATE POLICY "Users can view own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- Show cache: anyone can read
CREATE POLICY "Anyone can read show cache" ON public.show_cache
  FOR SELECT USING (true);

-- Audit log: users can read own logs
CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to expire stale holds
CREATE OR REPLACE FUNCTION expire_stale_holds()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.reservations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'holding' AND hold_expiry < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
