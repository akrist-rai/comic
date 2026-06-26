import { useMemo } from 'react';
import { useMangaState } from '../context/MangaContext';
import type { Manga, Status } from '../types';
import { motion } from 'framer-motion';

// ── PHASE 9: CONCEPT — useMemo for expensive derived state ────────────────────
//
// Derived state = data computed from existing state.
// Rule: don't store derived state in useState — compute it from the source.
// Problem: computing it in the render function runs on every render.
// Solution: useMemo() — memoizes the result and only recomputes when deps change.
//
// Here we compute several aggregated stats from the manga list.
// The computation runs ONCE when `items` changes, not on every render.

// ── CONCEPT: Discriminated union narrowing ─────────────────────────────────────
// TypeScript can narrow types inside conditionals.
// statusConfig[status].label is safely typed because Status is a union type.

const STATUS_LABELS: Record<Status, string> = {
  reading:      'Reading',
  completed:    'Completed',
  on_hold:      'On Hold',
  dropped:      'Dropped',
  plan_to_read: 'Plan to Read',
};

const STATUS_COLORS: Record<Status, string> = {
  reading:      '#7c3aed',
  completed:    '#059669',
  on_hold:      '#d97706',
  dropped:      '#dc2626',
  plan_to_read: '#2563eb',
};

// ── Derived stats type ────────────────────────────────────────────────────────
interface MangaStats {
  total:          number;
  completed:      number;
  totalChapters:  number;
  avgRating:      number | null;
  topGenres:      [string, number][];    // [genreName, count][]
  byStatus:       { status: Status; count: number; color: string; label: string }[];
  avgProgress:    number | null;        // average completion % (for ongoing)
}

// ── Pure computation function ─────────────────────────────────────────────────
// Keeping the heavy computation in a plain function (not inline in useMemo)
// makes it testable in isolation. useMemo just calls it.
function computeStats(items: Manga[]): MangaStats {
  if (items.length === 0) {
    return {
      total: 0, completed: 0, totalChapters: 0,
      avgRating: null, topGenres: [], byStatus: [], avgProgress: null,
    };
  }

  const total         = items.length;
  const completed     = items.filter(m => m.status === 'completed').length;
  const totalChapters = items.reduce((sum, m) => sum + m.currentChapter, 0);

  // Rating average — only items that have been rated
  const rated  = items.filter(m => m.rating !== null);
  const avgRating = rated.length > 0
    ? rated.reduce((sum, m) => sum + (m.rating ?? 0), 0) / rated.length
    : null;

  // Genre frequency map
  const genreMap = new Map<string, number>();
  for (const m of items) {
    for (const g of m.genres) {
      genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
    }
  }
  // Sort by count desc, take top 5
  const topGenres = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Status distribution
  const statusMap = new Map<Status, number>();
  for (const m of items) {
    statusMap.set(m.status, (statusMap.get(m.status) ?? 0) + 1);
  }
  const byStatus = (Object.keys(STATUS_LABELS) as Status[])
    .filter(s => statusMap.has(s))
    .map(s => ({
      status: s,
      count:  statusMap.get(s) ?? 0,
      color:  STATUS_COLORS[s],
      label:  STATUS_LABELS[s],
    }));

  // Average completion % for manga with known total chapters
  const progressible = items.filter(m => m.totalChapters && m.totalChapters > 0);
  const avgProgress = progressible.length > 0
    ? progressible.reduce(
        (sum, m) => sum + m.currentChapter / (m.totalChapters!),
        0
      ) / progressible.length * 100
    : null;

  return { total, completed, totalChapters, avgRating, topGenres, byStatus, avgProgress };
}

// ── Stats page component ───────────────────────────────────────────────────────
export default function StatsPage() {
  const { items, loading } = useMangaState();

  // ── useMemo ───────────────────────────────────────────────────────────────
  // computeStats iterates all items — O(n*genres). Don't run it every render.
  // This result is recomputed only when `items` array reference changes.
  const stats = useMemo(() => computeStats(items), [items]);

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="detail-loading__spinner" />
        <p>Computing stats…</p>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <main className="stats-page">
        <h1 className="stats-page__title">Your Stats</h1>
        <p className="stats-empty">Add some manga to your library to see stats!</p>
      </main>
    );
  }

  // ── CONCEPT: Derived value inline ─────────────────────────────────────────
  // Small, cheap computations don't need useMemo. Only memoize when the result
  // is expensive or when it's used as a dep in another hook.
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <main className="stats-page">
      <motion.h1
        className="stats-page__title"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        📊 Your Stats
      </motion.h1>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <motion.div
        className="stats-grid"
        initial="hidden"
        animate="visible"
        // ── CONCEPT: Framer Motion stagger via variants ──────────────────
        // Parent variant has staggerChildren. Each child with variants
        // inherits the orchestration — no manual delay on each child.
        variants={{
          hidden:  {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {[
          { label: 'Total Manga',      value: stats.total,            suffix: '' },
          { label: 'Completed',         value: stats.completed,        suffix: '' },
          { label: 'Completion Rate',   value: completionRate,         suffix: '%' },
          { label: 'Chapters Read',     value: stats.totalChapters,    suffix: '' },
          {
            label: 'Avg Rating',
            value: stats.avgRating != null ? stats.avgRating.toFixed(1) : '—',
            suffix: stats.avgRating != null ? '/10' : '',
          },
          {
            label: 'Avg Progress',
            value: stats.avgProgress != null ? Math.round(stats.avgProgress) : '—',
            suffix: stats.avgProgress != null ? '%' : '',
          },
        ].map(kpi => (
          <motion.div
            key={kpi.label}
            className="stats-kpi"
            variants={{
              hidden:  { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
            }}
          >
            <span className="stats-kpi__value">
              {kpi.value}{kpi.suffix}
            </span>
            <span className="stats-kpi__label">{kpi.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="stats-bottom">
        {/* ── Status breakdown ──────────────────────────────────────────────── */}
        <motion.section
          className="stats-section"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h2 className="stats-section__title">By Status</h2>
          <div className="stats-bars">
            {stats.byStatus.map(({ status, count, color, label }) => {
              const pct = Math.round((count / stats.total) * 100);
              return (
                <div key={status} className="stats-bar-row">
                  <span className="stats-bar-row__label">{label}</span>
                  <div className="stats-bar-row__track">
                    <motion.div
                      className="stats-bar-row__fill"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="stats-bar-row__count">
                    {count} <small>({pct}%)</small>
                  </span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Top genres ────────────────────────────────────────────────────── */}
        {stats.topGenres.length > 0 && (
          <motion.section
            className="stats-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h2 className="stats-section__title">Top Genres</h2>
            <div className="stats-genres">
              {stats.topGenres.map(([genre, count], i) => (
                <motion.div
                  key={genre}
                  className="stats-genre-pill"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.06 }}
                >
                  <span className="stats-genre-pill__rank">#{i + 1}</span>
                  {genre}
                  <span className="stats-genre-pill__count">{count}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </main>
  );
}
