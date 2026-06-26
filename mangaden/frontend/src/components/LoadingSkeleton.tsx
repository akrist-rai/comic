// ── PHASE 3: CONCEPT — Loading Skeleton ──────────────────────────────────────
// While data is being fetched, we show placeholder cards that match the real
// layout. This prevents layout shift and gives instant visual feedback.
//
// The skeleton has zero props — it just renders a fixed number of placeholder
// cards. The animation is handled purely in CSS (shimmer keyframe).

export function LoadingSkeleton() {
  return (
    <div className="manga-grid">
      {/* ── CONCEPT: Array.from for repeat rendering ──────────────────────────
          We want 8 skeleton cards but have no data array to .map().
          Array.from({ length: 8 }) creates [undefined × 8].
          The index `i` gives us a stable key. */}
      {Array.from({ length: 8 }, (_, i) => (
        <article key={i} className="manga-card skeleton-card">
          <div className="skeleton-cover" />
          <div className="skeleton-info">
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line skeleton-line--long"  />
            <div className="skeleton-line skeleton-line--medium" />
          </div>
        </article>
      ))}
    </div>
  );
}
