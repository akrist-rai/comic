import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Manga } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RatingStars } from '../components/RatingStars';
import { SymbolCover } from '../components/SymbolCover';
import { useMangaDispatch } from '../context/MangaContext';
import { useToast } from '../context/ToastContext';
import { EditMangaModal } from '../components/EditMangaModal';

export default function MangaDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useMangaDispatch();
  const { showToast } = useToast();

  const [manga,   setManga]   = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();

    fetch(`/api/manga/${id}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<Manga>;
      })
      .then(data => setManga(data))
      .catch(err => { if (err.name !== 'AbortError') setError('Could not load item.'); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const handleDelete = async () => {
    if (!manga || !id) return;
    if (!window.confirm(`Delete "${manga.title}"? This cannot be undone.`)) return;
    await fetch(`/api/manga/${id}`, { method: 'DELETE' });
    dispatch({ type: 'REMOVE', payload: id });
    showToast(`"${manga.title}" deleted.`, 'info');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="detail-loading__spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="detail-error">
        <p>{error ?? 'Item not found.'}</p>
        <button type="button" className="btn btn--ghost" onClick={() => navigate('/')}>
          ← Back to library
        </button>
      </div>
    );
  }

  return (
    <div className="detail">

      {/* ── Blurred hero background ── */}
      <div className="detail__hero-bg">
        {manga.coverUrl
          ? <img src={manga.coverUrl} alt="" aria-hidden="true" className="detail__hero-bg-img" />
          : <div className="detail__hero-bg-fallback" />
        }
        <div className="detail__hero-bg-gradient" />
      </div>

      {/* ── Floating cover ── */}
      <div className="detail__poster-wrap">
        <motion.div
          className="detail__poster"
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {manga.coverUrl
            ? <img src={manga.coverUrl} alt={`Cover for ${manga.title}`} className="detail__poster-img" />
            : <SymbolCover title={manga.title} type={manga.type} />
          }
        </motion.div>
      </div>

      {/* ── Info centered below ── */}
      <motion.div
        className="detail__body"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="detail__meta-row">
          <StatusBadge status={manga.status} />
          <span className="detail__type-badge">{manga.type.replace('_', ' ')}</span>
        </div>

        <h1 className="detail__title">{manga.title}</h1>

        {manga.author && (
          <p className="detail__author">{manga.author}</p>
        )}

        <div className="detail__rating-row">
          <RatingStars rating={manga.rating} />
        </div>

        {manga.genres.length > 0 && (
          <div className="detail__genres">
            {manga.genres.map(g => (
              <span key={g} className="manga-card__genre-tag">{g}</span>
            ))}
          </div>
        )}

        {manga.notes && (
          <div className="detail__notes-container">
            <span className="detail__notes-title">Personal Notes</span>
            <blockquote className="detail__notes">{manga.notes}</blockquote>
          </div>
        )}

        <div className="detail__actions">
          <button type="button" className="btn btn--primary" onClick={() => setEditing(true)}>
            Edit Details
          </button>
          <button type="button" className="btn btn--danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </motion.div>

      {editing && (
        <EditMangaModal
          manga={manga}
          onClose={() => setEditing(false)}
          onSave={(updated) => setManga(updated)}
        />
      )}
    </div>
  );
}
