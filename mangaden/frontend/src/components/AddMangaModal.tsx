import { useReducer, useEffect, useRef, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { Status } from '../types';
import { useMangaDispatch } from '../context/MangaContext';
import { useToast } from '../context/ToastContext';
import { CoverUpload } from './CoverUpload';

// ── MOTION CONCEPT 5: initial / animate / exit ────────────────────────────────
//
// These three props are the core of Framer Motion:
//
//   initial  → the state BEFORE the element enters the DOM
//   animate  → the state it animates TO (its natural/visible state)
//   exit     → the state it animates TO when leaving the DOM
//              (only works inside <AnimatePresence> in the parent!)
//
// Think of it as:
//   initial ──[enter animation]──▶ animate ──[exit animation]──▶ exit
//
// For the overlay (the dark backdrop):
//   - Fades in from opacity 0 → 1
//   - Fades out from opacity 1 → 0
//
// For the modal box itself:
//   - Enters from: opacity 0, scaled down (0.92), shifted up (y: -16)
//   - Animates to: opacity 1, full size (1), natural position (y: 0)
//   - Exits to:    same as initial — shrinks and fades out

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ── MOTION CONCEPT 6: Spring transitions ─────────────────────────────────────
//
// Framer Motion has three transition types:
//
//   tween   → fixed duration + easing (like CSS transitions)
//   spring  → physics-based, bouncy. Controlled by:
//               stiffness: how fast the spring pulls (higher = faster)
//               damping:   how much it resists bouncing (higher = less bounce)
//               mass:      simulated weight (higher = slower, more momentum)
//   inertia → momentum-based (for scroll/drag release)
//
// Springs feel more natural for UI elements because real-world objects
// don't stop at exactly the right moment — they overshoot slightly, then settle.

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: -16,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -16,
    transition: {
      duration: 0.18,
      ease: 'easeIn' as const,
    },
  },
};

interface FormState {
  title:         string;
  author:        string;
  status:        Status;
  totalChapters: string;
  genres:        string;
  coverBase64:   string | null;
  submitting:    boolean;
  error:         string | null;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'submitting' | 'error' | 'coverBase64'>; value: string }
  | { type: 'SET_COVER'; value: string | null }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_ERROR'; value: string | null }
  | { type: 'RESET' };

const initialForm: FormState = {
  title: '', author: '', status: 'plan_to_read',
  totalChapters: '', genres: '',
  coverBase64: null,
  submitting: false, error: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':      return { ...state, [action.field]: action.value };
    case 'SET_COVER':      return { ...state, coverBase64: action.value };
    case 'SET_SUBMITTING': return { ...state, submitting: action.value };
    case 'SET_ERROR':      return { ...state, error: action.value, submitting: false };
    case 'RESET':          return initialForm;
    default:               return state;
  }
}

interface AddMangaModalProps {
  onClose: () => void;
}

export function AddMangaModal({ onClose }: AddMangaModalProps) {
  const dispatch = useMangaDispatch();
  // ── CONCEPT: Using multiple contexts in one component ────────────────────────
  // A component can consume as many contexts as it needs.
  // Each useX() call subscribes to that specific context independently.
  const { showToast } = useToast();
  const [form, formDispatch] = useReducer(formReducer, initialForm);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      formDispatch({ type: 'SET_ERROR', value: 'Title is required.' });
      return;
    }
    formDispatch({ type: 'SET_SUBMITTING', value: true });

    try {
      const res = await fetch('/api/manga', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title.trim(),
          author:        form.author.trim() || null,
          status:        form.status,
          totalChapters: form.totalChapters ? Number(form.totalChapters) : null,
          genres:        form.genres
            ? form.genres.split(',').map(g => g.trim()).filter(Boolean)
            : [],
          coverUrl: form.coverBase64 ?? null,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const created = await res.json();
      dispatch({ type: 'ADD', payload: created });
      // ── CONCEPT: showToast replaces alert() ─────────────────────────────
      // alert() blocks the UI thread and looks terrible.
      // showToast is non-blocking and the toast auto-dismisses — better UX.
      showToast(`"${created.title}" added to library!`, 'success');
      onClose();
    } catch {
      formDispatch({ type: 'SET_ERROR', value: 'Failed to add manga. Is the backend running?' });
      showToast('Failed to add manga. Is the backend running?', 'error');
    }
  };

  const setField = (field: keyof Omit<FormState, 'submitting' | 'error' | 'coverBase64'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      formDispatch({ type: 'SET_FIELD', field, value: e.target.value });

  return (
    // ── Animated overlay ─────────────────────────────────────────────────────
    // motion.div with variants + initial/animate/exit.
    // When Library's <AnimatePresence> removes this from the tree,
    // it will animate to the "exit" variant before unmounting.
    <motion.div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Add manga"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // ── transition for the overlay itself ────────────────────────────────
      // duration: 0.2 → quick backdrop fade, feels lighter than the modal
      transition={{ duration: 0.2 }}
    >
      {/* ── Animated modal box ─────────────────────────────────────────────
          This is a NESTED motion element. It has its own variants independent
          of the overlay — different timing, spring physics vs. tween.
          Nested motion elements animate independently. */}
      <motion.div
        className="modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="modal__header">
          <h2 className="modal__title">Add Manga</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form" noValidate>

          <div className="form-field">
            <span className="form-field__label">Cover Image</span>
            <CoverUpload
              preview={form.coverBase64}
              onChange={(base64) => formDispatch({ type: 'SET_COVER', value: base64 })}
            />
          </div>

          <label className="form-field">
            <span className="form-field__label">Title *</span>
            <input
              ref={firstInputRef}
              className="form-field__input"
              type="text"
              value={form.title}
              onChange={setField('title')}
              placeholder="e.g. Berserk"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Author</span>
            <input
              className="form-field__input"
              type="text"
              value={form.author}
              onChange={setField('author')}
              placeholder="e.g. Kentaro Miura"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Status</span>
            <select className="form-field__input" value={form.status} onChange={setField('status')}>
              <option value="plan_to_read">Plan to Read</option>
              <option value="reading">Reading</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </label>

          <label className="form-field">
            <span className="form-field__label">Total Chapters</span>
            <input
              className="form-field__input"
              type="number"
              min="1"
              value={form.totalChapters}
              onChange={setField('totalChapters')}
              placeholder="Leave blank if ongoing"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Genres (comma-separated)</span>
            <input
              className="form-field__input"
              type="text"
              value={form.genres}
              onChange={setField('genres')}
              placeholder="e.g. Action, Dark Fantasy"
            />
          </label>

          {form.error && <p className="form-error">{form.error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={form.submitting}>
              {form.submitting ? 'Adding…' : 'Add Manga'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
