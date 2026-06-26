import { useState, useEffect } from 'react';

// ── PHASE 6: CONCEPT — useDebounce ───────────────────────────────────────────
// Debouncing delays a value update until the user has stopped changing it
// for `delay` milliseconds. Classic use case: search inputs.
//
// How it works:
//   1. Every time `value` changes, we set a setTimeout for `delay` ms.
//   2. The useEffect cleanup CANCELS the previous timeout before setting a new one.
//   3. So the debounced value only updates after `delay` ms of silence.
//
// This is a textbook example of why useEffect cleanup matters.
// Without the clearTimeout, every keystroke would queue a separate timer —
// they'd all fire, all update state, and you'd still be filtering on every key.

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // Schedule an update `delay` ms from now
    const timer = setTimeout(() => setDebounced(value), delay);

    // Cleanup: if value changes again before the timer fires, cancel it.
    // This is the core of debouncing.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
