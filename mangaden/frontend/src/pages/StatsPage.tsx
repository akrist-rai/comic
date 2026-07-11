import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMangaState } from '../context/MangaContext';
import type { Manga, Status, MediaType } from '../types';

interface EntryStats {
  total:      number;
  completed:  number;
  avgRating:  number | null;
  topGenres:  [string, number][];
  byStatus:   { status: Status;    count: number; color: string; label: string }[];
  byType:     { type:   MediaType; count: number; color: string; label: string }[];
}

const STATUS_LABELS: Record<Status, string> = {
  reading:      'In Progress',
  completed:    'Completed',
  on_hold:      'On Hold',
  dropped:      'Dropped',
  plan_to_read: 'Planned',
};

const STATUS_COLORS: Record<Status, string> = {
  reading:      '#22D3EE',
  completed:    '#4ADE80',
  on_hold:      '#FBBF24',
  dropped:      '#F87171',
  plan_to_read: '#A78BFA',
};

const TYPE_LABELS: Record<MediaType, string> = {
  manga:      'Manga',
  anime:      'Anime',
  web_series: 'Web Series',
  movie:      'Movies',
  book:       'Books',
  game:       'Games',
};

const TYPE_COLORS: Record<MediaType, string> = {
  manga:      '#8B5CF6',
  anime:      '#3B82F6',
  web_series: '#10B981',
  movie:      '#EF4444',
  book:       '#F59E0B',
  game:       '#EC4899',
};

function computeStats(items: Manga[]): EntryStats {
  if (items.length === 0) {
    return { total: 0, completed: 0, avgRating: null, topGenres: [], byStatus: [], byType: [] };
  }

  const total     = items.length;
  const completed = items.filter(m => m.status === 'completed').length;

  const rated     = items.filter(m => m.rating !== null);
  const avgRating = rated.length > 0
    ? rated.reduce((sum, m) => sum + (m.rating ?? 0), 0) / rated.length
    : null;

  const genreMap = new Map<string, number>();
  for (const m of items) {
    for (const g of m.genres) {
      genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
    }
  }
  const topGenres = [...genreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const statusMap = new Map<Status, number>();
  for (const m of items) statusMap.set(m.status, (statusMap.get(m.status) ?? 0) + 1);
  const byStatus = (Object.keys(STATUS_LABELS) as Status[])
    .filter(s => statusMap.has(s))
    .map(s => ({ status: s, count: statusMap.get(s) ?? 0, color: STATUS_COLORS[s], label: STATUS_LABELS[s] }));

  const typeMap = new Map<MediaType, number>();
  for (const m of items) {
    const t = m.type ?? 'manga';
    typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
  }
  const byType = (Object.keys(TYPE_LABELS) as MediaType[])
    .filter(t => typeMap.has(t))
    .map(t => ({ type: t, count: typeMap.get(t) ?? 0, color: TYPE_COLORS[t], label: TYPE_LABELS[t] }));

  return { total, completed, avgRating, topGenres, byStatus, byType };
}

export default function StatsPage() {
  const { items, loading } = useMangaState();
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
        <h1 className="stats-page__title">Stats</h1>
        <p className="stats-empty">Add some items to your library to see stats.</p>
      </main>
    );
  }

  const completionRate = Math.round((stats.completed / stats.total) * 100);

  const kpis = [
    { label: 'Total Items',    value: String(stats.total),    suffix: ''   },
    { label: 'Completed',      value: String(stats.completed), suffix: ''   },
    { label: 'Completion',     value: String(completionRate), suffix: '%'  },
    {
      label:  'Avg Rating',
      value:  stats.avgRating != null ? stats.avgRating.toFixed(1) : '—',
      suffix: stats.avgRating != null ? '/10' : '',
    },
  ];

  return (
    <main className="stats-page">
      <motion.h1
        className="stats-page__title"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Stats
      </motion.h1>

      {/* KPI cards */}
      <motion.div
        className="stats-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden:  {},
          visible: { transition: { staggerChildren: 0.07 } },
        }}
      >
        {kpis.map(kpi => (
          <motion.div
            key={kpi.label}
            className="stats-kpi"
            variants={{
              hidden:  { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
            }}
          >
            <span className="stats-kpi__value">{kpi.value}{kpi.suffix}</span>
            <span className="stats-kpi__label">{kpi.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="stats-bottom">
        {/* By Media Type */}
        <motion.section
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <h2 className="stats-section__title">By Type</h2>
          <div className="stats-bars">
            {stats.byType.map(({ type, count, color, label }) => {
              const pct = Math.round((count / stats.total) * 100);
              return (
                <div key={type} className="stats-bar-row">
                  <span className="stats-bar-row__label">{label}</span>
                  <div className="stats-bar-row__track">
                    <motion.div
                      className="stats-bar-row__fill"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="stats-bar-row__count">{count} <small>({pct}%)</small></span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* By Status */}
        <motion.section
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
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
                      transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="stats-bar-row__count">{count} <small>({pct}%)</small></span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Top Genres */}
        {stats.topGenres.length > 0 && (
          <motion.section
            className="stats-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <h2 className="stats-section__title">Top Genres</h2>
            <div className="stats-genres">
              {stats.topGenres.map(([genre, count], i) => (
                <motion.div
                  key={genre}
                  className="stats-genre-pill"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
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
