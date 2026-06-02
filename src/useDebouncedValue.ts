import { useEffect, useState } from 'react';

/** Delay before running probability simulations after the last input change. */
export const SIMULATION_DEBOUNCE_MS = 150;

export function useDebouncedValue<T>(
  value: T,
  delayMs: number = SIMULATION_DEBOUNCE_MS
): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
