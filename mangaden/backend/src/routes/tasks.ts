import Router from '@koa/router';
import { and, desc, asc, eq, like, type SQL } from 'drizzle-orm';
import { db } from '../db/index';
import { tasks } from '../db/schema';

const router = new Router({ prefix: '/api/tasks' });

// GET /api/tasks?status=not_done&search=prepare
router.get('/', async (ctx) => {
  const { status, search } = ctx.query as Record<string, string>;
  const where: SQL[] = [];

  if (status && status !== 'all') {
    where.push(eq(tasks.status, status as 'done' | 'not_done'));
  }
  if (search) {
    where.push(like(tasks.title, `%${search}%`));
  }

  // Sort by creation date (newest first, or oldest first). Let's sort by oldest first (asc) so it acts as an orderly checklist.
  const rows = await db
    .select()
    .from(tasks)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(tasks.createdAt));

  ctx.body = rows;
});

// GET /api/tasks/:id
router.get('/:id', async (ctx) => {
  const row = await db.select().from(tasks).where(eq(tasks.id, ctx.params.id)).get();
  if (!row) {
    ctx.status = 404;
    ctx.body = { error: 'Task not found' };
    return;
  }
  ctx.body = row;
});

// POST /api/tasks
router.post('/', async (ctx) => {
  const body = ctx.request.body as any;
  const [created] = await db.insert(tasks).values({
    title:    body.title,
    status:   body.status ?? 'not_done',
    coverUrl: body.coverUrl ?? null,
  }).returning();

  ctx.status = 201;
  ctx.body = created;
});

// PUT /api/tasks/:id
router.put('/:id', async (ctx) => {
  const body = ctx.request.body as any;
  
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined)    updateData.title = body.title;
  if (body.status !== undefined)   updateData.status = body.status;
  if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl;

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, ctx.params.id))
    .returning();

  if (!updated) {
    ctx.status = 404;
    ctx.body = { error: 'Task not found' };
    return;
  }
  ctx.body = updated;
});

// DELETE /api/tasks/:id
router.delete('/:id', async (ctx) => {
  await db.delete(tasks).where(eq(tasks.id, ctx.params.id));
  ctx.status = 204;
});

export { router as tasksRouter };
