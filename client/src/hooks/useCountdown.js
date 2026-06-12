import { useState, useEffect, useRef } from 'react';

/**
 * Countdown hook that counts down to a target timestamp.
 */
export function useCountdown(targetTimestamp) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    targetTimestamp ? Math.max(0, targetTimestamp - Date.now()) : 0
  );

  const rafRef = useRef(null);
  const targetRef = useRef(targetTimestamp);

  useEffect(() => {
    targetRef.current = targetTimestamp;
    if (!targetTimestamp) {
      setTimeRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, targetRef.current - Date.now());
      setTimeRemaining(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetTimestamp]);

  const totalSeconds = Math.floor(timeRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalDuration = targetTimestamp ? targetTimestamp - (targetTimestamp - 2 * 60 * 60 * 1000) : 1;
  const percentage = targetTimestamp ? Math.max(0, Math.min(100, (timeRemaining / (2 * 60 * 60 * 1000)) * 100)) : 0;

  return {
    timeRemaining,
    hours,
    minutes,
    seconds,
    isExpired: timeRemaining <= 0 && !!targetTimestamp,
    isWarning: timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000, // last 5 min
    percentage,
    formatted: [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':'),
  };
}
