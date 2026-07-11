import { useReducer, useEffect, useRef, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown, Check } from 'lucide-react';
import type { Manga, Status, MediaType } from '../types';
import { useMangaDispatch } from '../context/MangaContext';
import { useToast } from '../context/ToastContext';
import { CoverUpload } from './CoverUpload';

interface FormState {
  title:          string;
  type:           MediaType;
  status:         Status;
  rating:         string;
  genres:         string;
  coverUrl:       string | null;
  notes:          string;
  submitting:     boolean;
  error:          string | null;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'submitting' | 'error' | 'coverUrl'>; value: string }
  | { type: 'SET_COVER'; value: string | null }
  | { type: 'SET_STATUS'; value: Status }
  | { type: 'SET_TYPE'; value: MediaType }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_ERROR'; value: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':      return { ...state, [action.field]: action.value };
    case 'SET_COVER':      return { ...state, coverUrl: action.value };
    case 'SET_STATUS':     return { ...state, status: action.value };
    case 'SET_TYPE':       return { ...state, type: action.value };
    case 'SET_SUBMITTING': return { ...state, submitting: action.value };
    case 'SET_ERROR':      return { ...state, error: action.value, submitting: false };
    default:               return state;
  }
}

interface EditMangaModalProps {
  manga: Manga;
  onClose: () => void;
  onSave: (updated: Manga) => void;
}

export function EditMangaModal({ manga, onClose, onSave }: EditMangaModalProps) {
  const dispatch = useMangaDispatch();
  const { showToast } = useToast();
  
  const initialForm: FormState = {
    title:          manga.title,
    type:           manga.type,
    status:         manga.status,
    rating:         manga.rating ? String(manga.rating) : '',
    genres:         manga.genres.join(', '),
    coverUrl:       manga.coverUrl,
    notes:          manga.notes ?? '',
    submitting:     false,
    error:          null,
  };

  const [form, formDispatch] = useReducer(formReducer, initialForm);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      formDispatch({ type: 'SET_ERROR', value: 'Title is required.' });
      return;
    }
    formDispatch({ type: 'SET_SUBMITTING', value: true });

    try {
      const res = await fetch(`/api/manga/${manga.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          form.title.trim(),
          type:           form.type,
          status:         form.status,
          rating:         form.rating ? Number(form.rating) : null,
          genres:         form.genres
            ? form.genres.split(',').map(g => g.trim()).filter(Boolean)
            : [],
          coverUrl:       form.coverUrl,
          notes:          form.notes.trim() || null,
          // Explicitly clear removed fields
          author:         null,
          currentChapter: 0,
          totalChapters:  null,
          startDate:      null,
          finishDate:     null,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const updated: Manga = await res.json();
      
      dispatch({ type: 'UPDATE', payload: updated });
      onSave(updated);
      showToast('Progress and details saved!', 'success');
      onClose();
    } catch {
      formDispatch({ type: 'SET_ERROR', value: 'Failed to update entry. Is the backend running?' });
      showToast('Failed to update entry.', 'error');
    }
  };

  const setField = (field: keyof Omit<FormState, 'submitting' | 'error' | 'coverUrl'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      formDispatch({ type: 'SET_FIELD', field, value: e.target.value });

  const statusOptions: { value: Status; label: string }[] =
    form.type === 'manga' || form.type === 'book'
      ? [
          { value: 'plan_to_read', label: 'Plan to Read' },
          { value: 'reading',      label: 'Reading' },
          { value: 'on_hold',      label: 'On Hold' },
          { value: 'completed',    label: 'Completed' },
          { value: 'dropped',      label: 'Dropped' },
        ]
      : form.type === 'game'
      ? [
          { value: 'plan_to_read', label: 'Plan to Play' },
          { value: 'reading',      label: 'Playing' },
          { value: 'on_hold',      label: 'On Hold' },
          { value: 'completed',    label: 'Completed' },
          { value: 'dropped',      label: 'Dropped' },
        ]
      : [
          { value: 'plan_to_read', label: 'Plan to Watch' },
          { value: 'reading',      label: 'Watching' },
          { value: 'on_hold',      label: 'On Hold' },
          { value: 'completed',    label: 'Completed' },
          { value: 'dropped',      label: 'Dropped' },
        ];

  const typeOptions: { value: MediaType; label: string }[] = [
    { value: 'manga',      label: 'Manga' },
    { value: 'anime',      label: 'Anime' },
    { value: 'web_series', label: 'Web Series' },
    { value: 'movie',      label: 'Movie' },
    { value: 'book',       label: 'Book' },
    { value: 'game',       label: 'Game' },
  ];

  return (
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content dialog-content--manga">
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">Edit Entry Details</Dialog.Title>
            <Dialog.Close className="dialog-close">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="dialog-form" noValidate>
            <div className="form-grid-layout">
              <div className="form-grid-left">
                <div className="form-field">
                  <span className="form-field__label">Cover Image</span>
                  <CoverUpload
                    preview={form.coverUrl}
                    onChange={(cover) => formDispatch({ type: 'SET_COVER', value: cover })}
                  />
                </div>
              </div>

              <div className="form-grid-right">
                <label className="form-field">
                  <span className="form-field__label">Title *</span>
                  <input
                    ref={firstInputRef}
                    className="form-field__input"
                    type="text"
                    value={form.title}
                    onChange={setField('title')}
                  />
                </label>

                <div className="form-row-2">
                  <div className="form-field">
                    <span className="form-field__label">Type</span>
                    <Select.Root
                      value={form.type}
                      onValueChange={(val) => formDispatch({ type: 'SET_TYPE', value: val as MediaType })}
                    >
                      <Select.Trigger className="select-trigger">
                        <Select.Value />
                        <Select.Icon className="select-icon">
                          <ChevronDown size={14} />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="select-content">
                          <Select.Viewport className="select-viewport">
                            {typeOptions.map(opt => (
                              <Select.Item key={opt.value} value={opt.value} className="select-item">
                                <Select.ItemText>{opt.label}</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <Check size={12} />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <div className="form-field">
                    <span className="form-field__label">Status</span>
                    <Select.Root
                      value={form.status}
                      onValueChange={(val) => formDispatch({ type: 'SET_STATUS', value: val as Status })}
                    >
                      <Select.Trigger className="select-trigger">
                        <Select.Value />
                        <Select.Icon className="select-icon">
                          <ChevronDown size={14} />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="select-content">
                          <Select.Viewport className="select-viewport">
                            {statusOptions.map(opt => (
                              <Select.Item key={opt.value} value={opt.value} className="select-item">
                                <Select.ItemText>{opt.label}</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <Check size={12} />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>

                <div className="form-row-2">
                  <label className="form-field">
                    <span className="form-field__label">Rating (1–10)</span>
                    <input
                      className="form-field__input"
                      type="number"
                      min="1"
                      max="10"
                      value={form.rating}
                      onChange={setField('rating')}
                      placeholder="Unrated"
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-field__label">Genres</span>
                    <input
                      className="form-field__input"
                      type="text"
                      value={form.genres}
                      onChange={setField('genres')}
                      placeholder="e.g. Action, Fantasy"
                    />
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-field__label">Personal Notes / Review</span>
                  <textarea
                    className="form-field__input form-field__input--textarea"
                    value={form.notes}
                    onChange={setField('notes')}
                    placeholder="Write your thoughts..."
                    rows={3}
                  />
                </label>
              </div>
            </div>

            {form.error && <p className="form-error">{form.error}</p>}

            <div className="dialog-footer">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={form.submitting}>
                {form.submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
