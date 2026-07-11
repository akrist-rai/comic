import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Manga } from '../types';
import { MangaCard } from '../components/MangaCard';
import { FilterBar, type FilterStatus } from '../components/FilterBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { AddMangaModal } from '../components/AddMangaModal';
import { useMangaState, useMangaDispatch } from '../context/MangaContext';
import { useManga } from '../hooks/useManga';

const gridVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const TYPE_FILTERS = [
  { id: 'all',        label: 'All'        },
  { id: 'manga',      label: 'Manga'      },
  { id: 'anime',      label: 'Anime'      },
  { id: 'web_series', label: 'Web Series' },
  { id: 'movie',      label: 'Movies'     },
  { id: 'book',       label: 'Books'      },
  { id: 'game',       label: 'Games'      },
];

export default function Library() {
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [activeType,   setActiveType]   = useState<string>('all');
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);

  const { items, loading, error } = useMangaState();
  const dispatch = useMangaDispatch();

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'SET_LOADING', payload: true });

    fetch('/api/manga', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
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

  const { manga: filteredManga } = useManga({ status: activeStatus, search, type: activeType });

  const handleGenreClick   = useCallback((genre: string) => { setActiveStatus('all'); setSearch(genre); }, []);
  const handleSearchChange = useCallback((q: string) => setSearch(q), []);
  const handleStatusChange = useCallback((s: FilterStatus) => setActiveStatus(s), []);
  const handleOpenModal    = useCallback(() => setShowModal(true),  []);
  const handleCloseModal   = useCallback(() => setShowModal(false), []);

  const isGenreFilter = search && activeStatus === 'all' && items.some(m => m.genres?.includes(search));

  return (
    <main className="library">
      <header className="library__header">
        <h1 className="library__title">Mangaden</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={handleOpenModal}>
          + Add Entry
        </button>
      </header>

      <div className="type-filters">
        {TYPE_FILTERS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`type-filters__pill ${activeType === t.id ? 'type-filters__pill--active' : ''}`}
            onClick={() => setActiveType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FilterBar
        activeStatus={activeStatus}
        search={search}
        total={items.length}
        filtered={filteredManga.length}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {isGenreFilter && (
        <div className="genre-filter-badge">
          <span>Genre: <strong>{search}</strong></span>
          <button
            type="button"
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
          <p>No items found.</p>
          {search && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSearch('')}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <motion.div
          key={activeStatus + activeType + search}
          className="manga-grid"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredManga.map(manga => (
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
