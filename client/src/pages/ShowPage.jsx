import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShowDetails from '../components/ShowDetails';
import SeatMap from '../components/SeatMap';
import HoldTimer from '../components/HoldTimer';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../hooks/useAuth';
import { holdsAPI } from '../api/client';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';

export default function ShowPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { url, show, seatLayout, availableSeats, demo } = location.state || {};

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holdActive, setHoldActive] = useState(false);
  const [holdData, setHoldData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Redirect if no show data
  if (!show) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          No show data. Please enter a URL from the home page.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const handleSeatToggle = useCallback((seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  }, []);

  const handleStartHold = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to hold seats.');
      return;
    }

    if (selectedSeats.length === 0) {
      setError('Please select at least one seat.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await holdsAPI.create({
        showUrl: url,
        seats: selectedSeats,
        movieName: show.movieName,
        venue: show.venue,
        showTime: show.showDate,
      });

      setHoldData(data.reservation);
      setHoldActive(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create hold. Please try again.';
      setError(msg);

      // If demo mode, simulate a hold for UI demonstration
      if (demo) {
        setHoldData({
          id: 'demo-' + Date.now(),
          movie_name: show.movieName,
          venue: show.venue,
          seats: selectedSeats,
          hold_expiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'holding',
        });
        setHoldActive(true);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!holdData) return;
    setLoading(true);
    try {
      await holdsAPI.confirm(holdData.id);
      navigate('/dashboard');
    } catch {
      // In demo mode, just navigate
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleRelease = async () => {
    if (!holdData) return;
    setLoading(true);
    try {
      await holdsAPI.cancel(holdData.id);
    } catch {
      // ignore
    }
    setHoldActive(false);
    setHoldData(null);
    setSelectedSeats([]);
    setLoading(false);
    setConfirmOpen(false);
  };

  const seatCount = availableSeats?.length || seatLayout?.reduce(
    (acc, s) => acc + s.rows.reduce((ra, r) => ra + r.seats.filter((seat) => seat.available && !seat.isAisle).length, 0),
    0
  ) || 0;

  return (
    <div className="container">
      {/* Back button */}
      <motion.button
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ marginBottom: 'var(--space-lg)' }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        id="back-btn"
      >
        <ArrowLeft size={16} />
        Back to Home
      </motion.button>

      {/* Demo banner */}
      {demo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--accent-amber-dim)',
            border: '1px solid rgba(255, 171, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-lg)',
            fontSize: '0.85rem',
            color: 'var(--accent-amber)',
            textAlign: 'center',
          }}
        >
          🎭 Demo Mode — Using generated seat layout. Connect to Supabase for full functionality.
        </motion.div>
      )}

      {/* Show Details */}
      <ShowDetails show={show} seatCount={seatCount} />

      <div style={{ marginTop: 'var(--space-xl)' }}>
        {/* Hold active: show timer */}
        {holdActive && holdData && (
          <motion.div
            className="glass-card-glow"
            style={{
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-lg)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4, color: 'var(--accent-green)' }}>
                ✓ Seats Held Successfully
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {selectedSeats.join(', ')} are being held for you
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <motion.button
                  className="btn btn-primary btn-sm"
                  onClick={() => setConfirmOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  id="proceed-payment-btn"
                >
                  Proceed to Payment
                </motion.button>
                <motion.button
                  className="btn btn-danger btn-sm"
                  onClick={handleRelease}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  id="release-btn"
                >
                  Release Seats
                </motion.button>
              </div>
            </div>
            <HoldTimer expiresAt={new Date(holdData.hold_expiry).getTime()} />
          </motion.div>
        )}

        {/* Seat Map */}
        <motion.div
          className="glass-card"
          style={{ padding: 'var(--space-lg)', overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
            Select Your Seats
          </h2>

          <SeatMap
            layout={seatLayout}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
            disabled={holdActive}
          />
        </motion.div>

        {/* Hold button */}
        {!holdActive && (
          <motion.div
            style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {error && (
              <motion.p
                className="form-error"
                style={{ marginBottom: 'var(--space-md)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={handleStartHold}
              disabled={selectedSeats.length === 0 || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="hold-seats-btn"
              style={{ minWidth: 260 }}
            >
              {loading ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <Lock size={18} />
                  Hold {selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''} for 2 Hours
                </>
              )}
            </motion.button>
            {!isAuthenticated && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                You'll need to sign in to hold seats
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        reservation={holdData}
        onConfirm={handleConfirm}
        onRelease={handleRelease}
        loading={loading}
      />
    </div>
  );
}
