import { motion } from 'framer-motion';

export default function StatusBadge({ status }) {
  const statusConfig = {
    holding: { label: 'Holding', className: 'status-badge--holding' },
    confirmed: { label: 'Confirmed', className: 'status-badge--confirmed' },
    expired: { label: 'Expired', className: 'status-badge--expired' },
    cancelled: { label: 'Cancelled', className: 'status-badge--cancelled' },
    failed: { label: 'Failed', className: 'status-badge--failed' },
  };

  const config = statusConfig[status] || statusConfig.cancelled;

  return (
    <motion.span
      className={`status-badge ${config.className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <span className="status-dot" />
      {config.label}
    </motion.span>
  );
}
