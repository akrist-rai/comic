import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

// ── PHASE 8: CONCEPT — createPortal ───────────────────────────────────────────
//
// React renders into a single root div (#root).
// But some UI (modals, toasts, dropdowns) needs to visually "escape" the DOM tree
// so z-index and overflow:hidden don't clip them.
//
// createPortal(jsx, domNode) renders `jsx` into `domNode` while keeping it in
// React's component tree. This means:
//   - State, context, and events still flow normally through React
//   - But the DOM node is a sibling of #root — not inside it
//
// Toasts are a perfect use-case. We render them into document.body.

// ── CONCEPT: useRef for mutable values (not DOM refs) ─────────────────────────
//
// useRef() creates a box: { current: value }
//
// The key difference from useState:
//   - Changing ref.current does NOT trigger a re-render
//   - The value persists across renders (unlike a local variable which is reset)
//
// Two main uses:
//   1. Pointing at a DOM element: <div ref={myRef} />
//   2. Storing a mutable value that should NOT cause re-renders when it changes,
//      e.g. setTimeout IDs, previous values, animation frame IDs, abort controllers
//
// Here we use it to store timer IDs for auto-dismiss without causing re-renders.

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ── CONCEPT: useId — generating stable unique IDs ─────────────────────────────
// React 18 added useId() for generating unique, stable IDs.
// BUT: useId is a component hook — we can't use it inside a callback.
// Instead we use a mutable counter ref: toastCounter.current++
// This is idiomatic for IDs in event handlers.

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── CONCEPT: useRef for timer tracking ────────────────────────────────────
  // We store a Map of toast ID → setTimeout handle.
  // When a toast is dismissed manually, we clear its pending timer.
  // Using a ref means changing the map doesn't cause a re-render.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const counterRef = useRef(0);

  // ── CONCEPT: useCallback with stable deps ─────────────────────────────────
  // showToast is passed via context to any consumer in the tree.
  // Without useCallback, every render of ToastProvider would create a new
  // function reference, causing all consumers to re-render unnecessarily.
  // The [] dep array means this function is created ONCE and reused forever.
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++counterRef.current}`;
    const toast: Toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    // Store the timer handle in the ref (not state — doesn't need a re-render)
    const handle = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, 3500);

    timersRef.current.set(id, handle);
  }, []); // stable — no deps

  const dismiss = useCallback((id: string) => {
    // Clear the pending timer so it doesn't fire after manual dismiss
    const handle = timersRef.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── CONCEPT: createPortal ──────────────────────────────────────────
          Even though <ToastContainer> is rendered here (inside MangaProvider,
          ThemeProvider, etc.), its DOM output will appear as a direct child of
          document.body — escaping any overflow or stacking context.        */}
      {createPortal(
        <ToastContainer toasts={toasts} onDismiss={dismiss} />,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ── ToastContainer — Framer Motion list animation ─────────────────────────────
// AnimatePresence with mode="sync" lets multiple toasts animate independently.
// Each toast has a unique key so React/Framer Motion tracks additions/removals.
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            // ── CONCEPT: Framer Motion layout animation ──────────────────
            // layout prop: when items are added/removed, all siblings
            // smoothly shift to fill the gap — no manual calculation needed.
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 20,  scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span className="toast__icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="toast__message">{toast.message}</span>
            <button
              className="toast__dismiss"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Custom hook ───────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
