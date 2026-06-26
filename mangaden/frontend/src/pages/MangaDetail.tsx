import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Manga } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RatingStars } from '../components/RatingStars';
import { useMangaDispatch } from '../context/MangaContext';
import { useToast } from '../context/ToastContext';

// ── PHASE 5: CONCEPT — useParams ─────────────────────────────────────────────
// useParams() reads URL parameters defined in the route.
// For the route "/manga/:id", useParams() returns { id: "3" }.
// The component doesn't need to be told its ID via props — it reads from the URL.
// This is how React Router keeps components decoupled from their parents.

// ── PHASE 5: CONCEPT — useNavigate ───────────────────────────────────────────
// useNavigate() returns a function that programmatically changes the URL.
// navigate(-1) goes back one step in history (like the browser back button).
// navigate('/') goes to the library root.

export default function MangaDetail() {
  const { id }  = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useMangaDispatch();
  const { showToast } = useToast();

  const [manga,    setManga]    = useState<Manga | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [editing,  setEditing]  = useState(false);

  // Inline edit fields
  const [chapter, setChapter] = useState('');
  const [rating,  setRating]  = useState('');
  const [saving,  setSaving]  = useState(false);

  // ── CONCEPT: useEffect with a dependency ─────────────────────────────────
  // This effect runs whenever `id` changes.
  // React compares the dep array after every render — if `id` is the same,
  // the effect is skipped. If it changed (user navigated to a different manga),
  // the old cleanup runs first, then the new effect fires.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // ── CONCEPT: AbortController ────────────────────────────────────────────
    // If the user navigates away before the fetch completes, the cleanup
    // function aborts the request. Without this, the fetch resolves on an
    // unmounted component — a memory leak and a potential state update on
    // unmounted component (React will warn about this).
    const controller = new AbortController();

    fetch(`/api/manga/${id}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<Manga>;
      })
      .then(data => {
        setManga(data);
        setChapter(String(data.currentChapter));
        setRating(data.rating != null ? String(data.rating) : '');
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError('Could not load manga.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const handleSave = async () => {
    if (!manga || !id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/manga/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentChapter: Number(chapter),
          rating: rating ? Number(rating) : null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated: Manga = await res.json();
      setManga(updated);
      // ── CONCEPT: Cross-component state sync via context dispatch ────────────
      // We update the global list so that if the user navigates back to the
      // library, the card shows the updated chapter/rating immediately.
      dispatch({ type: 'UPDATE', payload: updated });
      showToast('Progress saved!', 'success');
      setEditing(false);
    } catch {
      showToast('Failed to save. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
        <p>{error ?? 'Manga not found.'}</p>
        <button className="btn btn--ghost" onClick={() => navigate('/')}>← Back to library</button>
      </div>
    );
  }

  const progress = manga.totalChapters
    ? Math.round((manga.currentChapter / manga.totalChapters) * 100)
    : null;

  return (
    <main className="detail">
      <div className="detail__hero">

        {/* Cover — same MangaCover logic as the card.
            If the user uploaded a base64 image, it shows here.
            Otherwise the placeholder letters appear. */}
        <div className="detail__cover">
          {manga.coverUrl ? (
            <img src={manga.coverUrl} alt={`Cover for ${manga.title}`} className="detail__cover-img" />
          ) : (
            <div className="detail__cover-placeholder">
              {manga.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail__info">
          <StatusBadge status={manga.status} />
          <h1 className="detail__title">{manga.title}</h1>
          {manga.author && <p className="detail__author">{manga.author}</p>}

          <div className="detail__rating">
            <RatingStars rating={manga.rating} />
          </div>

          {manga.genres.length > 0 && (
            <div className="manga-card__genres">
              {manga.genres.map(g => (
                <span key={g} className="manga-card__genre-tag">{g}</span>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {manga.currentChapter > 0 && (
            <div className="detail__progress">
              <div className="detail__progress-label">
                <span>Chapter {manga.currentChapter}{manga.totalChapters ? `/${manga.totalChapters}` : ''}</span>
                {progress !== null && <span>{progress}%</span>}
              </div>
              {progress !== null && (
                <div className="detail__progress-bar">
                  <div className="detail__progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          {(manga.startDate || manga.finishDate) && (
            <div className="detail__dates">
              {manga.startDate  && <span>Started: {manga.startDate}</span>}
              {manga.finishDate && <span>Finished: {manga.finishDate}</span>}
            </div>
          )}

          {manga.notes && (
            <blockquote className="detail__notes">{manga.notes}</blockquote>
          )}

          {/* Actions */}
          <div className="detail__actions">
            {editing ? (
              <>
                {/* ── CONCEPT: Controlled inline edit ─────────────────────── */}
                <label className="form-field form-field--inline">
                  <span className="form-field__label">Chapter</span>
                  <input
                    className="form-field__input"
                    type="number"
                    min="0"
                    value={chapter}
                    onChange={e => setChapter(e.target.value)}
                  />
                </label>
                <label className="form-field form-field--inline">
                  <span className="form-field__label">Rating (1–10)</span>
                  <input
                    className="form-field__input"
                    type="number"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                    placeholder="—"
                  />
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button className="btn btn--primary" onClick={() => setEditing(true)}>Edit Progress</button>
                <button className="btn btn--danger"  onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
