import { useState, useEffect, useRef, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, Image as ImageIcon } from 'lucide-react';
import { useTaskDispatch } from '../context/TaskContext';
import { useToast } from '../context/ToastContext';

interface AddTaskModalProps {
  onClose: () => void;
}

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const dispatch = useTaskDispatch();
  const { showToast } = useToast();
  
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  
  const [imageList, setImageList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingImages, setLoadingImages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Fetch images from the /api/goodstuff folder
  useEffect(() => {
    fetch('/api/goodstuff')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load images');
        return res.json();
      })
      .then((data: { images: string[]; base: string }) => {
        setImageList(data.images || []);
      })
      .catch(err => {
        console.error('Error fetching images:', err);
      })
      .finally(() => {
        setLoadingImages(false);
      });

    const t = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          coverUrl: coverUrl,
          status: 'not_done',
        }),
      });
      
      if (!res.ok) throw new Error('Server error');
      const created = await res.json();
      dispatch({ type: 'ADD', payload: created });
      showToast(`Created task "${created.title}"`, 'success');
      onClose();
    } catch (err) {
      setError('Failed to create task.');
      showToast('Failed to create task.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter image list based on search query
  const filteredImages = imageList.filter(img =>
    img.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" style={{ maxWidth: '520px', padding: '1.8rem' }}>
          <div className="dialog-header" style={{ marginBottom: '1.2rem' }}>
            <Dialog.Title className="dialog-title">Create Minimal Task</Dialog.Title>
            <Dialog.Close className="dialog-close">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="dialog-form" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Task Name */}
            <label className="form-field">
              <span className="form-field__label" style={{ fontWeight: 600 }}>Task Name *</span>
              <input
                ref={firstInputRef}
                className="form-field__input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                style={{ fontSize: '15px', padding: '10px 14px' }}
              />
            </label>

            {/* Selected Image Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="form-field__label" style={{ margin: 0, fontWeight: 600 }}>Selected Image:</span>
              {coverUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={`/api/goodstuff/img/${encodeURIComponent(coverUrl)}`}
                    alt="Selected cover"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px', whiteSpace: 'nowrap' }}>
                    {coverUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCoverUrl(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ImageIcon size={14} /> None (Gradient fallback)
                </span>
              )}
            </div>

            {/* Image Picker */}
            <div className="image-picker-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="form-field__label" style={{ fontWeight: 600 }}>Choose from Image Library</span>
              
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  className="form-field__input"
                  placeholder="Search posters/covers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '34px', height: '36px', fontSize: '13px' }}
                />
              </div>

              {/* Scrollable grid */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)',
                padding: '8px',
              }}>
                {loadingImages ? (
                  <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>Loading images...</p>
                ) : filteredImages.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>No matching images found.</p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                    gap: '8px',
                  }}>
                    {filteredImages.map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setCoverUrl(img)}
                        style={{
                          background: 'none',
                          border: coverUrl === img ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          padding: 0,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          transform: coverUrl === img ? 'scale(1.05)' : 'none',
                        }}
                        title={img}
                      >
                        <img
                          src={`/api/goodstuff/img/${encodeURIComponent(img)}`}
                          alt={img}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="form-error" style={{ margin: 0 }}>{error}</p>}

            <div className="dialog-footer" style={{ marginTop: '0.5rem', gap: '8px' }}>
              <button type="button" className="btn btn--ghost" onClick={onClose} style={{ height: '38px', borderRadius: '8px' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting} style={{ height: '38px', borderRadius: '8px' }}>
                {submitting ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
