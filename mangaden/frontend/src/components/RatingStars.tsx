import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number | null;
  max?:   number;
}

export function RatingStars({ rating, max = 10 }: RatingStarsProps) {
  if (rating === null) {
    return <span className="rating-empty">Not rated</span>;
  }

  const filled = Math.round(rating);

  return (
    <div className="rating-stars">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={9}
          className={i < filled ? 'rating-star rating-star--filled' : 'rating-star rating-star--empty'}
          fill={i < filled ? 'currentColor' : 'none'}
        />
      ))}
      <span className="rating-value">{rating}/10</span>
    </div>
  );
}
