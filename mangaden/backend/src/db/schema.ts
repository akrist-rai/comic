import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const tasks = sqliteTable('tasks', {
  id:                 text('id').primaryKey().$defaultFn(() => createId()),
  title:              text('title').notNull(),
  status:             text('status', {
                        enum: ['done', 'not_done'],
                      }).notNull().default('not_done'),
  coverUrl:           text('cover_url'),
  createdAt:          integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt:          integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Task    = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
