import { motion } from 'framer-motion';
import { MapPin, Clock, Calendar, Film, Tag } from 'lucide-react';

export default function ShowDetails({ show, seatCount }) {
  if (!show) return null;

  const details = [
    { icon: MapPin, label: show.venue || 'Venue', color: 'var(--accent-cyan)' },
    { icon: Calendar, label: show.showDate || show.parsedAt?.split('T')[0] || 'Date', color: 'var(--accent-purple)' },
    { icon: Clock, label: show.showTime || 'Time', color: 'var(--accent-amber)' },
    { icon: Tag, label: show.language || show.format || 'Hindi', color: 'var(--accent-green)' },
  ].filter((d) => d.label);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="glass-card show-card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="show-card-poster" variants={itemVariants}>
        <Film size={48} style={{ color: 'rgba(255,255,255,0.7)' }} />
      </motion.div>

      <div className="show-card-info">
        <motion.h2 className="show-card-title" variants={itemVariants}>
          {show.movieName || 'Movie Title'}
        </motion.h2>

        {details.map((detail, i) => (
          <motion.div key={i} className="show-card-meta" variants={itemVariants}>
            <detail.icon size={16} style={{ color: detail.color }} />
            <span>{detail.label}</span>
          </motion.div>
        ))}

        {seatCount !== undefined && (
          <motion.div
            className="show-card-meta"
            variants={itemVariants}
            style={{ marginTop: 8 }}
          >
            <span
              style={{
                background: 'var(--accent-green-dim)',
                color: 'var(--accent-green)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {seatCount} seats available
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
