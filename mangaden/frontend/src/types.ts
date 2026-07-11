export type TaskStatus = 'done' | 'not_done';

export interface Task {
  id:                 string;
  title:              string;
  status:             TaskStatus;
  coverUrl:           string | null;
  createdAt:          string;
  updatedAt:          string;
}

export type Entry = Task;
