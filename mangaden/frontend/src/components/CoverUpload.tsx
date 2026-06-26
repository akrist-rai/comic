import { useRef } from 'react';

// ── CONCEPT: useRef on a file input ──────────────────────────────────────────
// File inputs are "uncontrolled" — React can't set their value.
// A ref gives us a direct DOM handle to call .click() programmatically.

// ── CONCEPT: FileReader + Canvas image compression ────────────────────────────
//
// The problem: a raw photo from your phone can be 4–10 MB.
// After FileReader.readAsDataURL(), it's ~33% larger as base64 text.
// Sending 12 MB in a JSON POST body is wasteful and breaks body size limits.
//
// The solution: use the Canvas API to resize the image before base64-encoding it.
//
// Canvas API workflow:
//   1. Create an off-screen <canvas> element (never added to the DOM)
//   2. Draw the image onto the canvas at a smaller size
//   3. Export the canvas as a JPEG with quality 0.75 (75%)
//   4. Result: a compact base64 string, typically under 100 KB
//
// This is called "client-side image compression" — no server needed.
// The browser's built-in canvas renderer handles the resize/re-encode.

const MAX_WIDTH  = 400;   // px — enough for a manga cover thumbnail
const MAX_HEIGHT = 600;   // px
const QUALITY    = 0.75;  // JPEG quality 0–1 (0.75 = good quality, small size)

function compressImage(file: File): Promise<string> {
  // We return a Promise because:
  //   - FileReader.onload is a callback (async)
  //   - Image.onload is another callback (async)
  // Wrapping in a Promise lets the caller use async/await instead of
  // nested callbacks — much cleaner.
  return new Promise((resolve, reject) => {

    // Step 1: Read the raw file as a data URL using FileReader
    const reader = new FileReader();
    reader.onerror = reject;

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Step 2: Load it into an Image object to get its natural dimensions
      const img = new Image();
      img.onerror = reject;

      img.onload = () => {
        // Step 3: Calculate the target size, keeping aspect ratio
        let { width, height } = img;

        // Scale down proportionally if either dimension exceeds our max
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        // Step 4: Create an off-screen canvas and draw the resized image onto it
        // OffscreenCanvas would be ideal but has spotty browser support.
        // document.createElement('canvas') is universal.
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        // drawImage(image, dx, dy, dWidth, dHeight) — draw at (0,0) scaled to our target size
        ctx.drawImage(img, 0, 0, width, height);

        // Step 5: Export as JPEG base64
        // toDataURL('image/jpeg', quality) returns "data:image/jpeg;base64,..."
        // We always output JPEG regardless of input format (PNG, WEBP, etc.)
        // because JPEG compresses photos much better than PNG.
        const compressed = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(compressed);
      };

      // Trigger img.onload by setting the src
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}

interface CoverUploadProps {
  preview:  string | null;
  onChange: (base64: string | null) => void;
}

export function CoverUpload({ preview, onChange }: CoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { onChange(null); return; }

    try {
      // ── Using the compressImage function ──────────────────────────────────
      // await pauses here until the Promise resolves (all the canvas work is done).
      // The component re-renders with the compressed base64 as the new preview.
      //
      // Before: raw FileReader result → could be 5 MB of base64
      // After:  canvas-compressed JPEG → typically 50–150 KB of base64
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch {
      // If compression fails (e.g. corrupted file), fall back gracefully
      onChange(null);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        <div className="cover-upload__preview">
          <img src={preview} alt="Cover preview" className="cover-upload__img" />
          <button
            type="button"
            className="cover-upload__remove"
            onClick={handleRemove}
            aria-label="Remove cover"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="cover-upload__zone"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="cover-upload__icon">🖼</span>
          <span className="cover-upload__label">Click to add cover</span>
          <span className="cover-upload__hint">JPG, PNG, WEBP · auto-compressed</span>
        </button>
      )}
    </div>
  );
}
