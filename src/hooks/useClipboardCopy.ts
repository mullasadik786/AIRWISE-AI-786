import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages temporary clipboard copy feedback state with automatic timer cleanup on unmount.
 */
export function useClipboardCopy(resetDelayMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copyText = useCallback(
    async (text: string, key = 'default'): Promise<boolean> => {
      try {
        if (!navigator?.clipboard?.writeText) {
          setCopiedKey(null);
          return false;
        }
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopiedKey(null), resetDelayMs);
        return true;
      } catch {
        setCopiedKey(null);
        return false;
      }
    },
    [resetDelayMs]
  );

  return {
    copiedKey,
    isCopied: (key = 'default') => copiedKey === key,
    copyText,
  };
}
