import { Router } from 'express';
import { supabasePublic } from '../db/supabase.js';
import supabase from '../db/supabase.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Create a new user account.
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, phone, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: { phone, display_name: displayName },
      },
    });

    if (error) {
      logger.warn('Signup failed', { email, error: error.message });
      return res.status(400).json({ error: error.message });
    }

    logger.info('User signed up', { userId: data.user?.id, email });

    res.status(201).json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Sign in with email and password.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Login failed', { email, error: error.message });
      return res.status(401).json({ error: error.message });
    }

    logger.info('User logged in', { userId: data.user.id });

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Sign out the current user.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      // Sign out from Supabase
      await supabasePublic.auth.signOut();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
});

export default router;
