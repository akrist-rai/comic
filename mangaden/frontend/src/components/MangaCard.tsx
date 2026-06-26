import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Manga } from '../types';
import { StatusBadge } from './StatusBadge';
import { RatingStars } from './RatingStars';

// ── NEW CONCEPT: React.memo ───────────────────────────────────────────────────
//
// By default, when a parent re-renders, ALL its children re-render too —
// even if the child's props haven't changed.
//
// React.memo (or just `memo`) wraps a component and adds a prop-equality check.
// Before re-rendering, React compares old props vs new props using Object.is().
// If every prop is the same reference, React SKIPS the render entirely.
//
// ── When to use memo ──────────────────────────────────────────────────────────
// Only when:
//   1. The component renders the same output given the same props (pure)
//   2. It re-renders often
//   3. It does meaningful work (complex JSX, expensive calculations)
//
// MangaCard is a good candidate: it renders a detailed card, and Library
// re-renders on every search keystroke — all 50+ cards would re-render
// even though only the filter results changed, not the individual cards.
//
// ── The catch: functions break memo ──────────────────────────────────────────
// If a parent passes a function as a prop (e.g. onGenreClick), that function
// is a NEW object on every render → Object.is() says "not equal" → memo skipped.
// Solution: the parent must wrap the function in `useCallback`. See Library.tsx.

const MotionLink = motion(Link);

// ── Animation tuning: make it more dramatic ──────────────────────────────────
// The previous y:24, duration:0.35 was subtle. We double it so it's unmistakable:
//   - y: 48 → cards start 48px below, slide up visibly
//   - opacity 0→1 so they "appear" as they rise
//   - 0.4s duration = slow enough to notice, fast enough to feel snappy

const cardVariants = {
  hidden:  { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      // This easing is "ease-out-expo": starts fast, decelerates sharply.
      // It feels more energetic than the standard "ease" curve.
    },
  },
};

interface MangaCardProps {
  manga:         Manga;
  // ── NEW PROP: onGenreClick ─────────────────────────────────────────────────
  // Optional callback so the parent (Library) can react when a genre tag
  // is clicked. We teach event propagation / stopPropagation below.
  // The `?` makes it optional — cards still work if not passed.
  onGenreClick?: (genre: string) => void;
}

function progressLabel(current: number, total: number | null): string {
  if (total === null) return `Ch. ${current}`;
  const pct = Math.round((current / total) * 100);
  return `Ch. ${current}/${total}  ·  ${pct}%`;
}

interface MangaCoverProps {
  coverUrl: string | null;
  title:    string;
}

function MangaCover({ coverUrl, title }: MangaCoverProps) {
  if (coverUrl) {
    return <img src={coverUrl} alt={`Cover art for ${title}`} className="manga-card__cover-img" />;
  }
  return (
    <div className="manga-card__cover-placeholder">
      {title.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── memo() wraps the component export ────────────────────────────────────────
// Syntax: memo(function ComponentName(...) { ... })
// Or:     const ComponentName = memo((props) => { ... })
// Both are equivalent. Named function form is better for DevTools.

export const MangaCard = memo(function MangaCard({ manga, onGenreClick }: MangaCardProps) {
  const genres = manga.genres ?? [];

  return (
    <MotionLink
      to={`/manga/${manga.id}`}
      className="manga-card-link"
      aria-label={`Open ${manga.title}`}
      variants={cardVariants}
      // ── Removed top-level `transition` prop ────────────────────────────────
      // Previously: transition={{ duration: 0.15 }} here overrode the variant's
      // transition timing. Framer Motion uses the element-level `transition`
      // as the DEFAULT for all animations, so it was shortcutting the 0.4s entrance.
      //
      // Fix: put transition inside each gesture state instead.
      whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
      whileTap={{   scale: 0.97, transition: { duration: 0.1  } }}
    >
      <article className="manga-card">

        <div className="manga-card__cover">
          <MangaCover coverUrl={manga.coverUrl} title={manga.title} />
        </div>

        <div className="manga-card__info">
          <StatusBadge status={manga.status} />
          <h3 className="manga-card__title">{manga.title}</h3>
          {manga.author && <p className="manga-card__author">{manga.author}</p>}
          <RatingStars rating={manga.rating} />
          {manga.currentChapter > 0 && (
            <p className="manga-card__progress">
              {progressLabel(manga.currentChapter, manga.totalChapters)}
            </p>
          )}
          {genres.length > 0 && (
            <div className="manga-card__genres">
              {genres.slice(0, 3).map(genre => (
                // ── NEW CONCEPT: Event propagation + stopPropagation ──────────
                //
                // The DOM event system "bubbles" events up the tree by default.
                // When you click this <span>, the click event fires here,
                // then bubbles up to its parent, then its grandparent, etc.
                //
                // Problem: this span is inside <MotionLink> (which renders <a>).
                // If the click bubbles up to the link, React Router navigates
                // to the detail page — NOT what we want when clicking a genre.
                //
                // Solution: e.stopPropagation()
                // This tells the browser: "stop here, don't let this event
                // travel any further up the tree." The Link never sees the click.
                //
                // Then we call onGenreClick(genre) if the parent provided it.
                <span
                  key={genre}
                  className={`manga-card__genre-tag ${onGenreClick ? 'manga-card__genre-tag--clickable' : ''}`}
                  onClick={
                    onGenreClick
                      ? (e) => {
                          e.stopPropagation();   // ← stops the bubble
                          onGenreClick(genre);   // ← tells Library to filter by this genre
                        }
                      : undefined
                  }
                  // Accessibility: if it's clickable, it should be keyboard-focusable
                  role={onGenreClick ? 'button' : undefined}
                  tabIndex={onGenreClick ? 0 : undefined}
                  onKeyDown={
                    onGenreClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            onGenreClick(genre);
                          }
                        }
                      : undefined
                  }
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

      </article>
    </MotionLink>
  );
});
