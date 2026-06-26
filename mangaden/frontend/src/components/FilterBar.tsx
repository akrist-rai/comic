import { motion, LayoutGroup } from 'framer-motion';
import type { Status } from '../types';

// ── MOTION CONCEPT 7: layoutId — the "magic move" ────────────────────────────
//
// `layoutId` is one of Framer Motion's most impressive features.
//
// If TWO different motion elements share the same layoutId, Framer Motion
// treats them as the SAME element in different positions and animates
// between them — even across completely different parts of the component tree.
//
// Here's how it creates the sliding tab indicator:
//
//   Render 1: Tab "All" is active → motion.span with layoutId="tab-pill"
//             appears INSIDE the "All" button.
//
//   Render 2: User clicks "Reading" → "All" is no longer active (its
//             motion.span is gone), "Reading" is active (its motion.span
//             appears).
//
//   Framer Motion sees: "A motion.span with layoutId='tab-pill' disappeared
//   from position X, and one appeared at position Y. I'll animate the
//   existing element moving from X to Y."
//
//   The result: a smooth sliding pill that moves between tabs — with zero
//   manual position tracking. You never calculate coordinates.
//
// This is called a "shared layout animation" or "magic move".

export type FilterStatus = Status | 'all';

const TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all',          label: 'All'          },
  { value: 'reading',      label: 'Reading'      },
  { value: 'completed',    label: 'Completed'    },
  { value: 'on_hold',      label: 'On Hold'      },
  { value: 'dropped',      label: 'Dropped'      },
  { value: 'plan_to_read', label: 'Plan to Read' },
];

interface FilterBarProps {
  activeStatus:   FilterStatus;
  search:         string;
  total:          number;
  filtered:       number;
  onStatusChange: (status: FilterStatus) => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  activeStatus,
  search,
  total,
  filtered,
  onStatusChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">

      {/* ── LayoutGroup: required for layoutId to work reliably ─────────────
          LayoutGroup tells Framer Motion: "all layoutId animations inside here
          belong to the same group." Without it, layoutId elements in a .map()
          loop can't find each other between render cycles.
          The `id` prop namespaces this group — prevents conflicts with any
          other layoutId elements elsewhere in the app. */}
      <LayoutGroup id="filter-tabs">
      <div className="filter-bar__tabs" role="tablist" aria-label="Filter by status">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={activeStatus === value}
            onClick={() => onStatusChange(value)}
            className={`filter-bar__tab ${activeStatus === value ? 'filter-bar__tab--active' : ''}`}
          >
            {/* ── layoutId pill ─────────────────────────────────────────────
                This span only renders when this tab IS active.
                When activeStatus changes, the old span disappears and the
                new one appears — Framer Motion morphs between them via layoutId.
                
                style={{ borderRadius: 4 }} — needed because Framer Motion
                animates border-radius during the layout transition too.
                Without it, you'd see a rectangular flash mid-animation. */}
            {activeStatus === value && (
              <motion.span
                className="filter-bar__tab-pill"
                layoutId="tab-pill"
                style={{ borderRadius: 4 }}
                // transition controls the LAYOUT animation speed
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {/* Tab label text sits on top of the pill via CSS positioning */}
            <span className="filter-bar__tab-label">{label}</span>
          </button>
        ))}
      </div>
      </LayoutGroup>

      <div className="filter-bar__right">
        <span className="filter-bar__count">
          {filtered === total ? `${total} titles` : `${filtered} of ${total}`}
        </span>
        <input
          type="search"
          className="filter-bar__search"
          placeholder="Search title…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search manga by title"
        />
      </div>
    </div>
  );
}
