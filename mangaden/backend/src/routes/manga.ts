import Router from '@koa/router';
import { and, desc, eq, like, type SQL } from 'drizzle-orm';
import path from 'path';
import { db } from '../db/index';
import { manga } from '../db/schema';

const router = new Router({ prefix: '/api/manga' });

// Helper: parse genres JSON stored as text
const parse = (m: typeof manga.$inferSelect) => ({
  ...m,
  genres: m.genres ? (JSON.parse(m.genres) as string[]) : [],
});

// POST /api/manga/upload-cover — multipart file upload, returns { url }
// Must be defined before /:id to avoid route collision
router.post('/upload-cover', async (ctx) => {
  const file = (ctx.request as any).files?.cover;
  if (!file) {
    ctx.status = 400;
    ctx.body   = { error: 'No file provided. Field name must be "cover".' };
    return;
  }
  const filepath = file.filepath ?? file.path;
  const filename = path.basename(filepath);
  ctx.body = { url: `/api/covers/${filename}` };
});

// GET /api/manga?status=reading&search=berserk&type=manga
router.get('/', async (ctx) => {
  const { status, search, type } = ctx.query as Record<string, string>;
  const where: SQL[] = [];

  if (status && status !== 'all') where.push(eq(manga.status, status as any));
  if (type && type !== 'all')     where.push(eq(manga.type, type as any));
  if (search)                     where.push(like(manga.title, `%${search}%`));

  const rows = await db
    .select()
    .from(manga)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(manga.updatedAt));

  ctx.body = rows.map(parse);
});

// GET /api/manga/stats — must come before /:id
router.get('/stats', async (ctx) => {
  const rows = await db.select().from(manga);
  const statusStats = rows.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const typeStats = rows.reduce(
    (acc, m) => {
      const t = m.type ?? 'manga';
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  ctx.body = { total: rows.length, byStatus: statusStats, byType: typeStats };
});

// GET /api/manga/:id
router.get('/:id', async (ctx) => {
  const row = await db.select().from(manga).where(eq(manga.id, ctx.params.id)).get();
  if (!row) { ctx.status = 404; ctx.body = { error: 'Not found' }; return; }
  ctx.body = parse(row);
});

// POST /api/manga
router.post('/', async (ctx) => {
  const body = ctx.request.body as any;
  const [created] = await db.insert(manga).values({
    title:          body.title,
    type:           body.type           ?? 'manga',
    author:         body.author         ?? null,
    coverUrl:       body.coverUrl       ?? null,
    status:         body.status         ?? 'plan_to_read',
    rating:         body.rating         ?? null,
    currentChapter: body.currentChapter ?? 0,
    totalChapters:  body.totalChapters  ?? null,
    notes:          body.notes          ?? null,
    genres:         body.genres         ? JSON.stringify(body.genres) : null,
    startDate:      body.startDate      ?? null,
    finishDate:     body.finishDate     ?? null,
  }).returning();
  ctx.status = 201;
  ctx.body = parse(created);
});

// PUT /api/manga/:id
router.put('/:id', async (ctx) => {
  const body = ctx.request.body as any;
  const [updated] = await db
    .update(manga)
    .set({ ...body, genres: body.genres ? JSON.stringify(body.genres) : undefined, updatedAt: new Date() })
    .where(eq(manga.id, ctx.params.id))
    .returning();
  if (!updated) { ctx.status = 404; ctx.body = { error: 'Not found' }; return; }
  ctx.body = parse(updated);
});

// DELETE /api/manga/:id
router.delete('/:id', async (ctx) => {
  await db.delete(manga).where(eq(manga.id, ctx.params.id));
  ctx.status = 204;
});

export { router as mangaRouter };
