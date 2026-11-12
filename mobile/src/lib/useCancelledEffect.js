import { useEffect } from 'react';

/**
 * useEffect wrapper that exposes a cancelled flag for async loads.
 * @param {(ctx: { cancelled: () => boolean }) => void | (() => void) | Promise<void>} effect
 * @param {unknown[]} deps
 */
export function useCancelledEffect(effect, deps) {
  useEffect(() => {
    let cancelled = false;
    const cleanup = effect({
      cancelled: () => cancelled,
    });
    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
