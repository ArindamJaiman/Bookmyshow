import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import URLInput from '../components/URLInput';
import { showsAPI } from '../api/client';
import { Zap, Shield, Clock, Sparkles } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUrlSubmit = async (url) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await showsAPI.parse(url);
      // Navigate to show page with parsed data
      navigate('/show', { state: { url, show: data.show, seatLayout: data.seatLayout, availableSeats: data.availableSeats } });
    } catch (err) {
      // If parse fails, use demo data for development
      const demoShow = {
        movieName: 'Dhurandhar 2',
        venue: 'Nexus Vijaya Mall, Chennai',
        showDate: '7 June 2026',
        showTime: '2:00 PM',
        language: 'Hindi',
        format: '2D',
        url,
      };
      const demoLayout = generateDemoLayout();
      navigate('/show', { state: { url, show: demoShow, seatLayout: demoLayout, availableSeats: [], demo: true } });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Instant Hold',
      desc: 'Select seats and hold them instantly with our automation engine.',
      color: 'var(--accent-cyan)',
    },
    {
      icon: Clock,
      title: '2-Hour Window',
      desc: 'Seats stay reserved for up to 2 hours while you decide.',
      color: 'var(--accent-amber)',
    },
    {
      icon: Shield,
      title: 'Auto Re-Select',
      desc: 'If seats get deselected, we automatically re-select them for you.',
      color: 'var(--accent-green)',
    },
    {
      icon: Sparkles,
      title: 'Real-Time Updates',
      desc: 'Live status updates via WebSocket so you always know your hold status.',
      color: 'var(--accent-purple)',
    },
  ];

  return (
    <div className="container">
      {/* Hero */}
      <div className="hero">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Hold Your Movie Seats{' '}
          <span className="text-gradient">Before Anyone Else</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Paste a BookMyShow URL, pick your seats, and we'll hold them for you for up to 2 hours.
          No more losing seats while you coordinate with friends.
        </motion.p>

        <URLInput onSubmit={handleUrlSubmit} loading={loading} />
      </div>

      {/* Features Grid */}
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-2xl)',
          marginBottom: 'var(--space-3xl)',
        }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            className="glass-card"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4, borderColor: f.color }}
            style={{ padding: 'var(--space-lg)', cursor: 'default', transition: 'border-color 0.3s' }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: `${f.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-md)',
              }}
            >
              <f.icon size={24} style={{ color: f.color }} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {f.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Generate a demo seat layout for development
 */
function generateDemoLayout() {
  const categories = [
    { name: 'PLATINUM RECLINER', price: '₹400', rows: ['A', 'B'], seatsPerRow: 10, aisles: [4, 7] },
    { name: 'GOLD', price: '₹280', rows: ['C', 'D', 'E', 'F', 'G'], seatsPerRow: 16, aisles: [4, 13] },
    { name: 'SILVER', price: '₹150', rows: ['H', 'I', 'J', 'K', 'L', 'M'], seatsPerRow: 20, aisles: [5, 16] },
  ];

  return categories.map((cat) => ({
    name: cat.name,
    price: cat.price,
    rows: cat.rows.map((rowLabel) => ({
      label: rowLabel,
      seats: Array.from({ length: cat.seatsPerRow }, (_, i) => {
        const colNum = i + 1;
        const isAisle = cat.aisles.includes(colNum);
        const isBooked = !isAisle && Math.random() < 0.15;
        return {
          id: `${rowLabel}${colNum}`,
          label: `${colNum}`,
          row: rowLabel,
          available: !isBooked && !isAisle,
          isAisle,
          booked: isBooked,
        };
      }),
    })),
  }));
}
