import { motion } from 'framer-motion';
import { useCountdown } from '../hooks/useCountdown';

export default function HoldTimer({ expiresAt, onExpired }) {
  const { formatted, percentage, isExpired, isWarning, hours, minutes, seconds } = useCountdown(expiresAt);

  // Notify parent when expired
  if (isExpired && onExpired) {
    onExpired();
  }

  // SVG circle parameters
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on time remaining
  let strokeColor = '#00e5ff'; // cyan
  if (percentage <= 15) strokeColor = '#ff5252'; // red
  else if (percentage <= 40) strokeColor = '#ffab00'; // amber

  return (
    <div className="hold-timer">
      <div className="hold-timer-ring">
        <svg viewBox="0 0 160 160">
          <circle className="ring-bg" cx="80" cy="80" r={radius} />
          <motion.circle
            className="ring-progress"
            cx="80"
            cy="80"
            r={radius}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={false}
            animate={{
              strokeDashoffset,
              stroke: strokeColor,
            }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>
        <div className="hold-timer-text">
          <motion.span
            className="hold-timer-time"
            style={{ color: isWarning ? '#ff5252' : undefined }}
            animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
            transition={isWarning ? { repeat: Infinity, duration: 1 } : {}}
          >
            {isExpired ? '00:00:00' : formatted}
          </motion.span>
          <span className="hold-timer-label">
            {isExpired ? 'Expired' : 'Remaining'}
          </span>
        </div>
      </div>
    </div>
  );
}
