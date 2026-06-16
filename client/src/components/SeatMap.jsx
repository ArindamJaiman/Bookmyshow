import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SeatLegend from './SeatLegend';
import { MAX_SEATS } from '../utils/constants';

export default function SeatMap({ layout, selectedSeats, onSeatToggle, heldSeats = [], disabled = false, isScanning = false }) {
  // Build a set of held seat IDs for quick lookup
  const heldSet = useMemo(() => new Set(heldSeats), [heldSeats]);
  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  const getSeatClass = (seat) => {
    if (seat.isAisle) return 'seat seat--aisle';
    if (seat.booked || !seat.available) return 'seat seat--booked';
    if (heldSet.has(seat.id)) return 'seat seat--held-others';
    if (selectedSet.has(seat.id)) return 'seat seat--selected';
    return 'seat';
  };

  const handleClick = (seat) => {
    if (disabled) return;
    if (seat.isAisle || seat.booked || !seat.available) return;
    if (heldSet.has(seat.id)) return;

    // Enforce max seat limit
    if (!selectedSet.has(seat.id) && selectedSeats.length >= MAX_SEATS) return;

    onSeatToggle(seat.id);
  };

  if (!layout || layout.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💺</div>
        <h3 className="empty-state-title">No Seat Layout Available</h3>
        <p className="empty-state-text">Seat layout could not be loaded for this show.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Screen Indicator */}
      <div className="screen-indicator">
        <svg viewBox="0 0 400 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 229, 255, 0)" />
              <stop offset="20%" stopColor="rgba(0, 229, 255, 0.3)" />
              <stop offset="50%" stopColor="rgba(0, 229, 255, 0.5)" />
              <stop offset="80%" stopColor="rgba(0, 229, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(0, 229, 255, 0)" />
            </linearGradient>
            <filter id="screenGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path
            d="M 30 35 Q 200 5 370 35"
            fill="none"
            stroke="url(#screenGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#screenGlow)"
          />
        </svg>
        <p className="screen-label">All eyes this way</p>
      </div>

      {/* Seat Sections */}
      <div className="seat-map-container" style={{ position: 'relative' }}>
        {isScanning && <div className="scanning-overlay" />}
        {layout.map((section, sIdx) => (
          <motion.div
            key={section.name}
            className="seat-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.15 }}
          >
            <div className="seat-section-header">
              <span className="seat-section-name">{section.name}</span>
              <span className="seat-section-price">{section.price}</span>
            </div>

            {section.rows.map((row, rIdx) => (
              <div key={row.label} className="seat-row">
                <span className="seat-row-label">{row.label}</span>
                <div style={{ display: 'flex', gap: 'var(--seat-gap)', alignItems: 'center' }}>
                  {row.seats.map((seat) => (
                    <motion.button
                      key={seat.id}
                      className={getSeatClass(seat)}
                      onClick={() => handleClick(seat)}
                      disabled={disabled || seat.booked || !seat.available || seat.isAisle}
                      title={seat.isAisle ? '' : `${seat.id}${seat.booked ? ' (Booked)' : ''}`}
                      whileHover={
                        !seat.isAisle && !seat.booked && seat.available && !disabled
                          ? { scale: 1.2 }
                          : {}
                      }
                      whileTap={
                        !seat.isAisle && !seat.booked && seat.available && !disabled
                          ? { scale: 0.9 }
                          : {}
                      }
                      layout
                      id={`seat-${seat.id}`}
                    >
                      {!seat.isAisle && seat.label}
                    </motion.button>
                  ))}
                </div>
                <span className="seat-row-label">{row.label}</span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <SeatLegend />

      {/* Selection summary */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'var(--accent-cyan-dim)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected:{' '}
              <span className="text-mono" style={{ color: 'var(--accent-cyan)' }}>
                {selectedSeats.join(', ')}
              </span>
            </p>
            {selectedSeats.length >= MAX_SEATS && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginTop: 4 }}>
                Maximum {MAX_SEATS} seats reached
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
