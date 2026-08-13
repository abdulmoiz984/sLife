import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SECONDS = 60;

/**
 * Cooldown for OTP resend (default 60s) to avoid frequent API calls.
 * @param {number} durationSeconds
 * @param {{ startOnMount?: boolean }} options
 */
export const useResendCooldown = (
  durationSeconds = DEFAULT_SECONDS,
  { startOnMount = false } = {},
) => {
  const [secondsLeft, setSecondsLeft] = useState(
    startOnMount ? durationSeconds : 0,
  );
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearTimer();
    setSecondsLeft(durationSeconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  }, [clearTimer, durationSeconds]);

  useEffect(() => {
    if (!startOnMount) {
      return clearTimer;
    }
    startCooldown();
    return clearTimer;
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      clearTimer();
    }
  }, [secondsLeft, clearTimer]);

  return {
    secondsLeft,
    isCoolingDown: secondsLeft > 0,
    startCooldown,
  };
};
