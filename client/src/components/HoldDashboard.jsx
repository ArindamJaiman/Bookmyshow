import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import HoldTimer from './HoldTimer';
import { formatSeats } from '../utils/formatters';
import { MapPin, Clock, Timer, Trash2, CreditCard, Plus } from 'lucide-react';

export default function HoldDashboard({ holds, onCancel, onConfirm, onExtend, loading }) {
  const navigate = useNavigate();

  if (!holds || holds.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎬</div>
        <h3 className="empty-state-title">No Active Holds</h3>
        <p className="empty-state-text">
          You don't have any seat holds yet. Go to the home page to get started!
        </p>
        <motion.button
          className="btn btn-primary"
          style={{ marginTop: 'var(--space-lg)' }}
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          id="go-home-btn"
        >
          Hold Seats Now
        </motion.button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <AnimatePresence>
        {holds.map((hold) => {
          const isActive = hold.isActive || (hold.status === 'holding' && new Date(hold.hold_expiry) > new Date());
          const expiresAt = hold.hold_expiry ? new Date(hold.hold_expiry).getTime() : null;

          return (
            <motion.div
              key={hold.id}
              className={`glass-card ${isActive ? 'glass-card-glow' : ''}`}
              variants={itemVariants}
              layout
              style={{ marginBottom: 'var(--space-md)' }}
            >
              <div className="hold-card">
                <div className="hold-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <h3 className="hold-card-title">{hold.movie_name}</h3>
                    <StatusBadge status={hold.status} />
                  </div>

                  <div className="hold-card-subtitle">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 16 }}>
                      <MapPin size={14} /> {hold.venue}
                    </span>
                    {hold.show_time && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> {new Date(hold.show_time).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="hold-card-seats">
                    {hold.seats?.map((seat) => (
                      <span key={seat} className="hold-card-seat-tag">{seat}</span>
                    ))}
                  </div>

                  {isActive && (
                    <div className="hold-card-actions">
                      <motion.button
                        className="btn btn-primary btn-sm"
                        onClick={() => onConfirm(hold.id)}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        id={`confirm-hold-${hold.id}`}
                      >
                        <CreditCard size={14} />
                        Confirm
                      </motion.button>
                      {!hold.extended && (
                        <motion.button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onExtend(hold.id)}
                          disabled={loading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          id={`extend-hold-${hold.id}`}
                        >
                          <Plus size={14} />
                          Extend 30m
                        </motion.button>
                      )}
                      <motion.button
                        className="btn btn-danger btn-sm"
                        onClick={() => onCancel(hold.id)}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        id={`cancel-hold-${hold.id}`}
                      >
                        <Trash2 size={14} />
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>

                {isActive && expiresAt && (
                  <div style={{ flexShrink: 0 }}>
                    <HoldTimer expiresAt={expiresAt} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
