// This file has zero React in it — just TypeScript.
// Define your data shapes once here and import them everywhere.
// This is the single source of truth for what a manga entry looks like.

export type Status =
  | 'reading'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_read';

export type MediaType =
  | 'manga'
  | 'anime'
  | 'web_series'
  | 'movie'
  | 'book'
  | 'game';

export interface Manga {
  id:             string;
  title:          string;
  type:           MediaType;
  author?:        string | null;
  coverUrl:       string | null;
  status:         Status;
  rating:         number | null;   // 1–10, null = not yet rated
  currentChapter?: number;
  totalChapters?:  number | null;
  notes:          string | null;
  genres:         string[];
  startDate?:      string | null;
  finishDate?:     string | null;
  createdAt:      string;
  updatedAt:      string;
}

export type Entry = Manga;
