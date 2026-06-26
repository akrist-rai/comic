# MangaDen

Full-stack manga tracker. Koa + Drizzle + SQLite backend, React + Vite + TypeScript frontend.
Built phase by phase to learn React.

---

## Setup

### Backend

```bash
cd backend
npm install
npm run db:push     # creates mangaden.db and runs migrations
npm run dev         # starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

Run both simultaneously — Vite proxies `/api` requests to the Koa server.

---

## Phase progress

| Phase | Concept                    | Status      |
|-------|----------------------------|-------------|
| 01    | Components, JSX, props     | ✅ current  |
| 02    | useState, events, forms    | —           |
| 03    | useEffect, fetch, API      | —           |
| 04    | Custom hooks               | —           |
| 05    | React Router               | —           |
| 06    | Context + useReducer       | —           |
| 07    | React Query                | —           |
| 08    | Performance                | —           |

---

## File map (Phase 1)

```
frontend/src/
  types.ts                   ← shared TypeScript interfaces
  App.tsx                    ← root component (shell)
  index.css                  ← global styles + design tokens
  components/
    StatusBadge.tsx          ← props + derived data from props
    RatingStars.tsx          ← optional props + Array.from rendering
    MangaCard.tsx            ← object props + conditional rendering + composition
  pages/
    Library.tsx              ← page component + mock data + .map() list rendering
```

---

## API reference

| Method | Path               | Description              |
|--------|--------------------|--------------------------|
| GET    | /api/manga         | List, with ?status= ?search= |
| GET    | /api/manga/stats   | Count by status          |
| GET    | /api/manga/:id     | Single entry             |
| POST   | /api/manga         | Create                   |
| PUT    | /api/manga/:id     | Update                   |
| DELETE | /api/manga/:id     | Delete                   |
