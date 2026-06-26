import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Manga } from '../types';
import { MangaCard } from '../components/MangaCard';
import { FilterBar, type FilterStatus } from '../components/FilterBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { AddMangaModal } from '../components/AddMangaModal';
import { useMangaState, useMangaDispatch } from '../context/MangaContext';
import { useManga } from '../hooks/useManga';

// ── NEW CONCEPT: useCallback ──────────────────────────────────────────────────
//
// Functions defined inside a component are recreated on EVERY render.
// This matters when you pass them as props — because React.memo compares
// props by reference, and a new function === a new reference === memo skipped.
//
// Example without useCallback:
//   const handleGenreClick = (genre: string) => setSearch(genre); // new fn every render
//   <MangaCard onGenreClick={handleGenreClick} />
//   → MangaCard re-renders on every Library render even if it's wrapped in memo()
//
// useCallback(fn, deps) returns the SAME function reference between renders
// unless one of the deps changes. It memoizes the function itself.
//
// Rule of thumb: wrap functions in useCallback when:
//   1. They are passed as props to a memo()-wrapped child
//   2. They are in a useEffect dependency array (otherwise effect re-runs every render)
//
// You'll see `useCallback` applied to all three handlers below.

// Stagger grid orchestration (same pattern — parent drives timing)
const gridVariants = {
  hidden:   {},
  visible:  {
    transition: {
      staggerChildren: 0.08,   // 80ms between cards — more noticeable than before
      delayChildren:   0.05,
    },
  },
};

export default function Library() {
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);

  const { items, loading, error } = useMangaState();
  const dispatch = useMangaDispatch();

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'SET_LOADING', payload: true });

    fetch('/api/manga', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch manga list');
        return res.json() as Promise<Manga[]>;
      })
      .then(data => dispatch({ type: 'SET_LIST', payload: data }))
      .catch(err => {
        if (err.name !== 'AbortError') {
          dispatch({ type: 'SET_ERROR', payload: 'Could not load library. Is the backend running?' });
        }
      });

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { manga: filteredManga } = useManga({ status: activeStatus, search });

  // ── useCallback: stable references for memo'd children ───────────────────
  //
  // setActiveStatus and setSearch come from useState — they are already stable
  // (same reference forever). But onGenreClick is a NEW function we define,
  // so we MUST use useCallback.
  //
  // Dependency array []: no deps means "never recreate this function".
  // setActiveStatus/setSearch are stable so they're safe to omit.

  const handleGenreClick = useCallback((genre: string) => {
    // When a genre tag is clicked: switch to "All" status + set search to the genre
    setActiveStatus('all');
    setSearch(genre);
  }, []); // stable deps — safe to use [] here

  const handleSearchChange = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const handleStatusChange = useCallback((status: FilterStatus) => {
    setActiveStatus(status);
  }, []);

  const handleOpenModal  = useCallback(() => setShowModal(true),  []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);

  return (
    <main className="library">
      <header className="library__header">
        <h1 className="library__title">
          Manga<span>Den</span>
        </h1>
        <button className="btn btn--primary btn--sm" onClick={handleOpenModal}>
          + Add
        </button>
      </header>

      {/* ── FilterBar receives stable callbacks ─────────────────────────────
          Because onStatusChange / onSearchChange are wrapped in useCallback,
          their references never change → FilterBar (if wrapped in memo) won't
          re-render just because Library re-renders. */}
      <FilterBar
        activeStatus={activeStatus}
        search={search}
        total={items.length}
        filtered={filteredManga.length}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Active genre filter badge — shows what genre is being searched */}
      {search && activeStatus === 'all' && items.some(m => m.genres?.includes(search)) && (
        <div className="genre-filter-badge">
          <span>Genre: <strong>{search}</strong></span>
          <button
            className="genre-filter-badge__clear"
            onClick={() => setSearch('')}
            aria-label="Clear genre filter"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : filteredManga.length === 0 ? (
        <div className="empty-state">
          <p>No manga found.</p>
          {search && (
            <button className="btn btn--ghost btn--sm" onClick={() => setSearch('')}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        // key changes on filter/search → Framer Motion remounts the grid → stagger replays
        <motion.div
          key={activeStatus + search}
          className="manga-grid"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredManga.map(manga => (
            // ── memo pays off here ───────────────────────────────────────────
            // Library re-renders on every search keystroke.
            // Without memo: ALL MangaCard components re-render on every keystroke.
            // With memo + useCallback: only cards whose props changed re-render.
            // For a library of 200 titles, this is a significant performance win.
            <MangaCard
              key={manga.id}
              manga={manga}
              onGenreClick={handleGenreClick}
            />
          ))}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {showModal && <AddMangaModal onClose={handleCloseModal} />}
      </AnimatePresence>
    </main>
  );
}
