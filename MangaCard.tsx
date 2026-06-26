import type { Manga } from '../types';
import { StatusBadge } from './StatusBadge';
import { RatingStars } from './RatingStars';

// ── CONCEPT: Object props ────────────────────────────────────────────────────
// Instead of passing 12 individual fields, we pass the whole manga object.
// This is the standard pattern for "entity components" — components that
// represent one item from your data model.
//
// The tradeoff: the component now depends on the full Manga shape.
// For leaf components (StatusBadge), individual props are cleaner.
// For card/row components, the whole object is simpler.

interface MangaCardProps {
  manga: Manga;
}

// ── CONCEPT: Helper functions outside the component ─────────────────────────
// Small pure functions that don't touch React keep JSX readable.
// They're not components (lowercase, return a primitive, not JSX).
// This one lives here because it only serves MangaCard.

function progressLabel(current: number, total: number | null): string {
  if (total === null) return `Ch. ${current}`;
  const pct = Math.round((current / total) * 100);
  return `Ch. ${current}/${total}  ·  ${pct}%`;
}

export function MangaCard({ manga }: MangaCardProps) {
  const genres = manga.genres ?? [];

  // ── CONCEPT: JSX must have one root element ─────────────────────────────
  // Every component returns a single root. If you need to avoid adding
  // a wrapper div, use <>...</> (a Fragment) which renders nothing in the DOM.

  return (
    <article className="manga-card">

      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <div className="manga-card__cover">
        {manga.coverUrl ? (
          // ── CONCEPT: Ternary conditional rendering ──────────────────────
          // condition ? <WhenTrue /> : <WhenFalse />
          // This is the main pattern when you have two possible outcomes.
          <img src={manga.coverUrl} alt={`Cover art for ${manga.title}`} />
        ) : (
          <div className="manga-card__cover-placeholder">
            {manga.title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Info ───────────────────────────────────────────────────────── */}
      <div className="manga-card__info">

        {/*
          Composing child components:
          StatusBadge and RatingStars are imported and used just like HTML tags.
          We pass data down via props — this is the whole React data model.
          Data flows in one direction: Library → MangaCard → StatusBadge/RatingStars.
        */}
        <StatusBadge status={manga.status} />

        <h3 className="manga-card__title">{manga.title}</h3>

        {/* ── CONCEPT: Short-circuit rendering ─────────────────────────────
            condition && <Element />
            When condition is false, React renders nothing.
            Use this when there is no "else" branch needed. */}
        {manga.author && (
          <p className="manga-card__author">{manga.author}</p>
        )}

        <RatingStars rating={manga.rating} />

        {manga.currentChapter > 0 && (
          <p className="manga-card__progress">
            {progressLabel(manga.currentChapter, manga.totalChapters)}
          </p>
        )}

        {genres.length > 0 && (
          <div className="manga-card__genres">
            {/* ── CONCEPT: .map() for rendering a data list ────────────────
                Every item needs a stable, unique key — here `genre` the string
                is unique within a single manga's genre list, so it works fine. */}
            {genres.slice(0, 3).map((genre) => (
              <span key={genre} className="manga-card__genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}

      </div>
    </article>
  );
}
