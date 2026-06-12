import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HoldDashboard from '../components/HoldDashboard';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { holdsAPI } from '../api/client';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmHold, setConfirmHold] = useState(null);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'hold:status' || msg.type === 'hold:expired' || msg.type === 'hold:failed') {
      fetchHolds(); // Refresh on status change
    }
  }, []);

  const { isConnected, connect, disconnect } = useWebSocket(handleWsMessage);

  const fetchHolds = async () => {
    try {
      const { data } = await holdsAPI.list();
      setHolds(data.reservations || []);
    } catch {
      // Use empty on error
      setHolds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    fetchHolds();
    connect();

    return () => disconnect();
  }, [isAuthenticated]);

  const handleCancel = async (id) => {
    setActionLoading(true);
    try {
      await holdsAPI.cancel(id);
      await fetchHolds();
    } catch {
      // ignore
    }
    setActionLoading(false);
  };

  const handleConfirm = async (id) => {
    const hold = holds.find((h) => h.id === id);
    if (hold) setConfirmHold(hold);
  };

  const handleConfirmAction = async () => {
    if (!confirmHold) return;
    setActionLoading(true);
    try {
      const { data } = await holdsAPI.confirm(confirmHold.id);
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
      }
      await fetchHolds();
    } catch {
      // ignore
    }
    setActionLoading(false);
    setConfirmHold(null);
  };

  const handleRelease = async () => {
    if (!confirmHold) return;
    await handleCancel(confirmHold.id);
    setConfirmHold(null);
  };

  const handleExtend = async (id) => {
    setActionLoading(true);
    try {
      await holdsAPI.extend(id);
      await fetchHolds();
    } catch {
      // ignore
    }
    setActionLoading(false);
  };

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Your <span className="text-gradient">Holds</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              Manage your active and past seat reservations
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              color: isConnected ? 'var(--accent-green)' : 'var(--text-muted)',
            }}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <motion.button
              className="btn btn-secondary btn-sm"
              onClick={fetchHolds}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="refresh-holds-btn"
            >
              <RefreshCw size={14} />
              Refresh
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 150, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <HoldDashboard
            holds={holds}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            onExtend={handleExtend}
            loading={actionLoading}
          />
        )}
      </motion.div>

      <ConfirmModal
        isOpen={!!confirmHold}
        onClose={() => setConfirmHold(null)}
        reservation={confirmHold}
        onConfirm={handleConfirmAction}
        onRelease={handleRelease}
        loading={actionLoading}
      />
    </div>
  );
}
