import { useState, useEffect, useRef, useCallback } from 'react';

export const useGameTimer = (duration, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const endTimeRef = useRef(null);
  const timerRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  // Update ref to avoid stale closure issues
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const tick = useCallback(() => {
    if (!isRunning || !endTimeRef.current) return;
    
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
    
    setTimeLeft(remaining);
    
    if (remaining <= 0) {
      setIsRunning(false);
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    } else {
      timerRef.current = requestAnimationFrame(tick);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isRunning, tick]);

  const start = useCallback(() => {
    endTimeRef.current = Date.now() + duration * 1000;
    setTimeLeft(duration);
    setIsRunning(true);
  }, [duration]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  }, []);

  const reset = useCallback((newDuration = duration) => {
    setIsRunning(false);
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setTimeLeft(newDuration);
  }, [duration]);

  return { timeLeft, isRunning, start, stop, reset };
};
