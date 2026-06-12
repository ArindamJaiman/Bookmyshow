import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { BOOKMYSHOW_URL_REGEX } from '../utils/constants';

export default function URLInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      triggerError('Please enter a BookMyShow URL');
      return;
    }

    if (!BOOKMYSHOW_URL_REGEX.test(url.trim())) {
      triggerError('Please enter a valid BookMyShow URL (e.g., https://in.bookmyshow.com/...)');
      return;
    }

    onSubmit(url.trim());
  };

  const triggerError = (msg) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  return (
    <motion.div
      className="url-input-area"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <div className={`url-input-wrapper ${shaking ? 'shake' : ''}`}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Link2
              size={20}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              id="url-input"
              className={`input input-lg ${error ? 'input-error' : ''}`}
              style={{ paddingLeft: 48 }}
              type="url"
              placeholder="Paste your BookMyShow show URL here..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
            />
            <motion.button
              type="submit"
              className="btn btn-primary url-input-btn"
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="url-submit-btn"
              style={{ padding: '10px 24px' }}
            >
              {loading ? (
                <Loader2 size={18} className="spinner" style={{ border: 'none', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  Find Seats
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {error && (
          <motion.p
            className="form-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'center' }}
          >
            <AlertCircle size={14} />
            {error}
          </motion.p>
        )}
      </form>

      <p className="url-input-hint">
        Paste a BookMyShow show URL to view available seats and start holding
      </p>
    </motion.div>
  );
}
