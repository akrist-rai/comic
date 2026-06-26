import type { Status } from '../types';

// ── CONCEPT: Props interface ─────────────────────────────────────────────────
// Props are the "inputs" to a component. Define their shape with a TypeScript
// interface. The parent component must provide everything that isn't optional (?).
//
// Think of it like a function signature — this IS a function signature.

interface StatusBadgeProps {
  status: Status;
}

// ── CONCEPT: Deriving display data from props ────────────────────────────────
// Map raw data → display values BEFORE the JSX. Keeps the markup clean.
// This object is defined outside the component because it never changes —
// there's no reason to recreate it on every render.

const STATUS_MAP: Record<Status, { label: string; color: string }> = {
  reading:       { label: 'Reading',       color: '#4ECDC4' },
  completed:     { label: 'Completed',     color: '#51CF66' },
  on_hold:       { label: 'On hold',       color: '#FFD43B' },
  dropped:       { label: 'Dropped',       color: '#FF6B6B' },
  plan_to_read:  { label: 'Plan to read',  color: '#868E96' },
};

// ── CONCEPT: A component is a function that returns JSX ─────────────────────
// { status }: StatusBadgeProps  →  we destructure props in the signature.
// Equivalent to:  function StatusBadge(props) { const { status } = props; }
// but cleaner.
//
// Named export (not default) because this file could export multiple components.

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, color } = STATUS_MAP[status];

  // ── CONCEPT: JSX is not HTML ───────────────────────────────────────────────
  // JSX compiles to React.createElement('span', { style: {...} }, label).
  // Key differences from HTML you'll run into:
  //   class     → className     (class is a reserved word in JS)
  //   style=""  → style={{}}    (style takes an object, not a string)
  //   for=""    → htmlFor=""    (for is also reserved)
  //   {}        → embed any JS  expression inside JSX

  return (
    <span
      style={{
        backgroundColor: `${color}22`,  // hex colour + alpha suffix
        color,
        border:          `1px solid ${color}44`,
        borderRadius:    '3px',
        padding:         '2px 8px',
        fontSize:        '11px',
        fontWeight:      500,
        letterSpacing:   '0.05em',
        textTransform:   'uppercase' as const,
        whiteSpace:      'nowrap' as const,
      }}
    >
      {/* {} embeds a JS expression. Here it just outputs the string. */}
      {label}
    </span>
  );
}
