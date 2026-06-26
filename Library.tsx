import type { Manga } from '../types';
import { MangaCard } from '../components/MangaCard';

// ── CONCEPT: Mock data for Phase 1 ──────────────────────────────────────────
// Static data lets us focus entirely on components + props.
// The shape is identical to what the Koa API returns — so when we replace this
// with a fetch() call in Phase 3, the MangaCard component won't change at all.
// That's the power of separating data-fetching from rendering.

const MOCK_MANGA: Manga[] = [
  {
    id: '1',
    title: 'Berserk',
    author: 'Kentaro Miura',
    coverUrl: null,
    status: 'reading',
    rating: 10,
    currentChapter: 364,
    totalChapters: 374,
    notes: 'The magnum opus.',
    genres: ['Dark Fantasy', 'Action', 'Psychological'],
    startDate: '2023-01-01',
    finishDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Vinland Saga',
    author: 'Makoto Yukimura',
    coverUrl: null,
    status: 'completed',
    rating: 9,
    currentChapter: 207,
    totalChapters: 207,
    notes: 'War, peace, and what it means to fight.',
    genres: ['Historical', 'Action', 'Drama'],
    startDate: '2023-03-15',
    finishDate: '2023-08-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    coverUrl: null,
    status: 'reading',
    rating: 8,
    currentChapter: 165,
    totalChapters: null,
    notes: null,
    genres: ['Action', 'Horror', 'Dark Comedy'],
    startDate: '2023-06-01',
    finishDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Monster',
    author: 'Naoki Urasawa',
    coverUrl: null,
    status: 'completed',
    rating: 10,
    currentChapter: 162,
    totalChapters: 162,
    notes: 'Nothing compares.',
    genres: ['Thriller', 'Mystery', 'Psychological'],
    startDate: '2022-12-01',
    finishDate: '2023-02-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    coverUrl: null,
    status: 'on_hold',
    rating: 8,
    currentChapter: 800,
    totalChapters: null,
    notes: 'On pause at Whole Cake Island.',
    genres: ['Adventure', 'Action', 'Fantasy'],
    startDate: '2021-05-01',
    finishDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Vagabond',
    author: 'Takehiko Inoue',
    coverUrl: null,
    status: 'plan_to_read',
    rating: null,
    currentChapter: 0,
    totalChapters: 327,
    notes: null,
    genres: ['Historical', 'Samurai', 'Drama'],
    startDate: null,
    finishDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── CONCEPT: Page components ─────────────────────────────────────────────────
// Library is a "page" component — it owns the data and composes smaller pieces.
// The fundamental React data model:
//
//   Library (owns data)
//     └─ MangaCard × 6  (receives manga via props)
//          ├─ StatusBadge  (receives status via props)
//          └─ RatingStars  (receives rating via props)
//
// Data flows DOWN. A child never reaches up to modify its parent's data.
// That's "unidirectional data flow" — React's core mental model.

export default function Library() {
  return (
    <main className="library">
      <header className="library__header">
        <h1 className="library__title">
          Manga<span>Den</span>
        </h1>
        <p className="library__subtitle">{MOCK_MANGA.length} titles</p>
      </header>

      {/* ── CONCEPT: Rendering a list of components ────────────────────────
          .map() transforms an array of data into an array of JSX elements.
          Each MangaCard receives its manga object as a prop.
          The key prop is NOT in MangaCardProps — React consumes it internally
          and never passes it to the component. Always use a stable ID as key. */}
      <div className="manga-grid">
        {MOCK_MANGA.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    </main>
  );
}
