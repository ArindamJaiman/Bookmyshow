import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { X, Mail, Lock, User } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <button className="modal-close" onClick={onClose} id="auth-modal-close">
                <X size={18} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                initial={{ x: mode === 'login' ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: mode === 'login' ? 20 : -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-name">Display Name</label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={18}
                        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                      />
                      <input
                        id="auth-name"
                        className="input"
                        style={{ paddingLeft: 42 }}
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-email">Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      id="auth-email"
                      className="input"
                      style={{ paddingLeft: 42 }}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      id="auth-password"
                      className="input"
                      style={{ paddingLeft: 42 }}
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    className="form-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--space-md)' }}
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={loading}
                  id="auth-submit"
                >
                  {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="form-divider">or</div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%' }}
                  onClick={toggleMode}
                  id="auth-toggle"
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </button>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
