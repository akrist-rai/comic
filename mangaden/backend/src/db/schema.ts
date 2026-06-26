import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const manga = sqliteTable('manga', {
  id:             text('id').primaryKey().$defaultFn(() => createId()),
  title:          text('title').notNull(),
  author:         text('author'),
  coverUrl:       text('cover_url'),
  status:         text('status', {
                    enum: ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'],
                  }).notNull().default('plan_to_read'),
  rating:         real('rating'),                                // 1–10, null = unrated
  currentChapter: integer('current_chapter').default(0),
  totalChapters:  integer('total_chapters'),                     // null = ongoing
  notes:          text('notes'),
  genres:         text('genres'),                                // JSON-encoded string[]
  startDate:      text('start_date'),
  finishDate:     text('finish_date'),
  createdAt:      integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt:      integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Manga    = typeof manga.$inferSelect;
export type NewManga = typeof manga.$inferInsert;
