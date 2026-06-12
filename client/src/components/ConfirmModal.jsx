import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Unlock } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ConfirmModal({ isOpen, onClose, reservation, onConfirm, onRelease, loading }) {
  if (!reservation) return null;

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
              <h2 className="modal-title">Confirm Your Booking</h2>
              <button className="modal-close" onClick={onClose} id="confirm-modal-close">
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                    {reservation.movie_name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {reservation.venue}
                  </p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-md)' }}>
                {reservation.seats?.map((seat) => (
                  <span key={seat} className="hold-card-seat-tag">{seat}</span>
                ))}
              </div>

              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
              }}>
                <p>By confirming, you'll be redirected to BookMyShow to complete payment.</p>
                <p>Your seats will remain held during the payment process.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <motion.button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={onConfirm}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="confirm-payment-btn"
              >
                {loading ? <span className="spinner" /> : (
                  <>
                    <CreditCard size={18} />
                    Proceed to Payment
                  </>
                )}
              </motion.button>
              <motion.button
                className="btn btn-danger"
                onClick={onRelease}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="release-seats-btn"
              >
                <Unlock size={18} />
                Release
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
