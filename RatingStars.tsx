// ── CONCEPT: Optional props with default values ──────────────────────────────
// max?: number  →  the ? marks it optional.
// Default parameter syntax (max = 10) provides the fallback.
// The caller can pass max={5} to get a 5-star scale, or omit it for /10.

interface RatingStarsProps {
  rating: number | null;
  max?:   number;
}

export function RatingStars({ rating, max = 10 }: RatingStarsProps) {
  // ── CONCEPT: Early return ────────────────────────────────────────────────
  // Handle the null/empty case at the top before any other logic.
  // This keeps the "happy path" code unindented and readable.
  if (rating === null) {
    return <span style={{ color: '#3a3a3a', fontSize: '12px' }}>—</span>;
  }

  const filled = Math.round(rating);

  // ── CONCEPT: Rendering a list with Array.from() ──────────────────────────
  // Array.from({ length: n }, (_, i) => ...)  creates n items.
  //   _  is the value (unused)
  //   i  is the index (0-based)
  //
  // React renders arrays of JSX elements just fine.
  // This is the pattern for "render N of something" when N is dynamic.

  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        // ── CONCEPT: The key prop ────────────────────────────────────────
        // Every element in a rendered list needs a unique, stable key.
        // React uses keys to figure out which items were added, removed,
        // or reordered between renders — without them React has to re-render
        // everything from scratch.
        //
        // Using index as key is fine here because the list never reorders.
        // In real data-driven lists, always use a stable ID (e.g. manga.id).
        <span
          key={i}
          style={{
            width:           '7px',
            height:          '7px',
            borderRadius:    '50%',
            backgroundColor: i < filled ? '#E84545' : '#252525',
            flexShrink:      0,
            transition:      'background-color 0.1s',
          }}
        />
      ))}
      <span style={{ color: '#505050', fontSize: '11px', marginLeft: '5px' }}>
        {rating}/10
      </span>
    </div>
  );
}
