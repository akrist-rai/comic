import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Manga, MediaType } from '../types';
import { StatusBadge } from './StatusBadge';
import { SymbolCover } from './SymbolCover';

const MotionLink = motion(Link);

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

interface MangaCardProps {
  manga:         Manga;
  onGenreClick?: (genre: string) => void;
}

function MangaCover({ coverUrl, title, type }: { coverUrl: string | null; title: string; type: MediaType }) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`Cover for ${title}`}
        className="manga-card__cover-img"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <SymbolCover title={title} type={type} />;
}

export const MangaCard = memo(function MangaCard({ manga, onGenreClick }: MangaCardProps) {
  const genres = manga.genres ?? [];

  return (
    <MotionLink
      to={`/manga/${manga.id}`}
      className="manga-card-link"
      aria-label={`Open ${manga.title}`}
      variants={cardVariants}
      whileHover={{ scale: 1.03, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={  { scale: 0.97, transition: { duration: 0.1 } }}
    >
      <article className="manga-card">
        <div className="manga-card__cover">
          <MangaCover coverUrl={manga.coverUrl} title={manga.title} type={manga.type} />
        </div>

        <div className="manga-card__overlay">
          <div className="manga-card__badges">
            <StatusBadge status={manga.status} />
            <span className="manga-card__type-badge">{manga.type.replace('_', ' ')}</span>
          </div>

          <h3 className="manga-card__title">{manga.title}</h3>

          {manga.rating != null && (
            <div className="manga-card__rating">
              <span className="manga-card__rating-val">★ {manga.rating}/10</span>
            </div>
          )}

          {genres.length > 0 && (
            <div className="manga-card__genres">
              {genres.slice(0, 2).map(genre =>
                onGenreClick ? (
                  <button
                    key={genre}
                    type="button"
                    className="manga-card__genre-tag"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGenreClick(genre); }}
                  >
                    {genre}
                  </button>
                ) : (
                  <span key={genre} className="manga-card__genre-tag">
                    {genre}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </article>
    </MotionLink>
  );
});
