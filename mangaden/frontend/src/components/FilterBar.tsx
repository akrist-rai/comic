import { motion, LayoutGroup } from 'framer-motion';
import { Search } from 'lucide-react';
import type { TaskStatus } from '../types';

export type FilterStatus = TaskStatus | 'all';

const TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all',      label: 'All Tasks' },
  { value: 'not_done', label: 'Not Done'  },
  { value: 'done',     label: 'Done'      },
];

interface FilterBarProps {
  activeStatus:     FilterStatus;
  search:           string;
  total:            number;
  filtered:         number;
  onStatusChange:   (status: FilterStatus) => void;
  onSearchChange:   (query: string) => void;
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
      <LayoutGroup id="filter-tabs">
        <div className="filter-bar__tabs" role="tablist" aria-label="Filter by status">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeStatus === value ? 'true' : 'false'}
              onClick={() => onStatusChange(value)}
              className={`filter-bar__tab ${activeStatus === value ? 'filter-bar__tab--active' : ''}`}
            >
              {activeStatus === value && (
                <motion.span
                  className="filter-bar__tab-pill"
                  layoutId="tab-pill"
                  style={{ borderRadius: 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="filter-bar__tab-label">{label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <div className="filter-bar__right" style={{ justifyContent: 'flex-end', gap: '16px' }}>
        <span className="filter-bar__count" style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {filtered === total ? `${total} tasks` : `${filtered} of ${total}`}
        </span>
        <div className="filter-bar__search-wrap">
          <Search size={13} className="filter-bar__search-icon" />
          <input
            type="search"
            className="filter-bar__search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search by title"
          />
        </div>
      </div>
    </div>
  );
}
