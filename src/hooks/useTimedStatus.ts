import { useCallback, useEffect, useRef, useState } from 'react';

export interface TimedStatusState {
  text: string;
  isError: boolean;
}

/**
 * Manages transient live-region status feedback with automatic timeout cleanup on unmount.
 */
export function useTimedStatus(defaultDurationMs = 3500) {
  const [status, setStatus] = useState<TimedStatusState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showStatus = useCallback(
    (text: string, isError = false, durationMs = defaultDurationMs) => {
      setStatus({ text, isError });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setStatus(null);
      }, durationMs);
    },
    [defaultDurationMs]
  );

  const clearStatus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus(null);
  }, []);

  return { status, showStatus, clearStatus };
}
