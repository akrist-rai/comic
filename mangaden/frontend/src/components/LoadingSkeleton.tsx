export function LoadingSkeleton() {
  return (
    <div className="manga-grid">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-cover" />
        </div>
      ))}
    </div>
  );
}
