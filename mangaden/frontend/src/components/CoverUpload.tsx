import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Upload, Image as ImageIcon, Search, X, Check } from 'lucide-react';

interface CoverUploadProps {
  preview:  string | null;
  onChange: (urlOrNull: string | null) => void;
}

export function CoverUpload({ preview, onChange }: CoverUploadProps) {
  const [open,          setOpen]          = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryBase,   setGalleryBase]   = useState('/api/goodstuff/img');
  const [search,        setSearch]        = useState('');
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/goodstuff')
      .then(res => res.json())
      .then(data => {
        if (data.images) setGalleryImages(data.images);
        if (data.base)   setGalleryBase(data.base);
      })
      .catch(() => {});
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('cover', file);

      const res = await fetch('/api/manga/upload-cover', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };
      onChange(url);
      setOpen(false);
    } catch {
      // Fallback: compress locally and use base64
      const base64 = await compressToBase64(file);
      onChange(base64);
      setOpen(false);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectGallery = (filename: string) => {
    onChange(`${galleryBase}/${encodeURIComponent(filename)}`);
    setOpen(false);
  };

  const filtered = galleryImages.filter(img => img.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="cover-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="cover-upload__input"
        onChange={handleFileChange}
        aria-label="Upload cover image"
      />

      {preview ? (
        <div className="cover-upload__preview-container" onClick={() => setOpen(true)}>
          <div className="cover-upload__preview">
            <img src={preview} alt="Cover preview" className="cover-upload__img" />
            <button
              type="button"
              className="cover-upload__remove"
              onClick={handleRemove}
              aria-label="Remove cover"
            >
              <X size={14} />
            </button>
            <div className="cover-upload__hover-overlay">
              <ImageIcon size={20} />
              <span>Change Cover</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="cover-upload__zone"
          onClick={() => setOpen(true)}
        >
          <ImageIcon size={26} />
          <span className="cover-upload__label">Choose Cover</span>
          <span className="cover-upload__hint">Gallery or local file</span>
        </button>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <div className="dialog-header">
              <Dialog.Title className="dialog-title">Select Cover Image</Dialog.Title>
              <Dialog.Close className="dialog-close"><X size={16} /></Dialog.Close>
            </div>

            <Tabs.Root defaultValue="gallery" className="tabs-root">
              <Tabs.List className="tabs-list">
                <Tabs.Trigger value="gallery" className="tabs-trigger">
                  <ImageIcon size={14} />
                  Gallery
                </Tabs.Trigger>
                <Tabs.Trigger value="upload" className="tabs-trigger">
                  <Upload size={14} />
                  Upload File
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="gallery" className="tabs-content">
                <div className="gallery-search-container">
                  <Search size={14} className="gallery-search-icon" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="gallery-search-input"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} className="gallery-search-clear">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <ScrollArea.Root className="scroll-area-root">
                  <ScrollArea.Viewport className="scroll-area-viewport">
                    {filtered.length === 0 ? (
                      <div className="gallery-empty"><p>No images found.</p></div>
                    ) : (
                      <div className="gallery-grid">
                        {filtered.map(filename => {
                          const url        = `${galleryBase}/${encodeURIComponent(filename)}`;
                          const isSelected = preview === url;
                          return (
                            <button
                              key={filename}
                              type="button"
                              className={`gallery-item ${isSelected ? 'gallery-item--selected' : ''}`}
                              onClick={() => handleSelectGallery(filename)}
                              aria-label={`Select cover: ${filename.replace(/\.[^/.]+$/, '')}`}
                            >
                              <img
                                src={url}
                                alt={filename}
                                loading="lazy"
                                className="gallery-item__img"
                              />
                              <div className="gallery-item__name">
                                {filename.replace(/\.[^/.]+$/, '')}
                              </div>
                              {isSelected && (
                                <div className="gallery-item__selected-badge">
                                  <Check size={12} color="#fff" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar className="scroll-area-scrollbar" orientation="vertical">
                    <ScrollArea.Thumb className="scroll-area-thumb" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </Tabs.Content>

              <Tabs.Content value="upload" className="tabs-content">
                <div
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} className="upload-dropzone__icon" />
                  <span className="upload-dropzone__label">
                    {uploading ? 'Uploading…' : 'Click to browse files'}
                  </span>
                  <span className="upload-dropzone__hint">JPEG, PNG, WEBP, GIF · Max 10 MB</span>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// Fallback: compress image to base64 if server upload fails
function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 500;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const r = Math.min(MAX / width, MAX / height);
          width  = Math.round(width  * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
