import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';
import { LayoutDashboard, Home, LogOut, LogIn, Armchair } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Animated background */}
      <div className="app-bg">
        <div className="app-bg-orb" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand" id="nav-brand">
          <Armchair size={24} style={{ color: 'var(--accent-cyan)' }} />
          <span>
            Seat<span className="text-gradient">Hold</span>
          </span>
        </Link>

        <ul className="navbar-nav">
          <li>
            <Link
              to="/"
              className={`navbar-link ${isActive('/') ? 'active' : ''}`}
              id="nav-home"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Home size={16} />
                Home
              </span>
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link
                to="/dashboard"
                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
                id="nav-dashboard"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LayoutDashboard size={16} />
                  Dashboard
                </span>
              </Link>
            </li>
          )}
          <li>
            {isAuthenticated ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                id="nav-logout"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={16} />
                {user?.email?.split('@')[0]}
              </button>
            ) : (
              <motion.button
                className="btn btn-primary btn-sm"
                onClick={() => setAuthOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                id="nav-login"
              >
                <LogIn size={16} />
                Sign In
              </motion.button>
            )}
          </li>
        </ul>
      </nav>

      {/* Main content */}
      <main className="page">
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: 'var(--space-lg)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <p>SeatHold — Technical Demo • Not affiliated with BookMyShow</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
