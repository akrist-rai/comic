import { useCallback, useMemo } from 'react';
import type { Task, TaskStatus } from '../types';
import { useTaskState } from '../context/TaskContext';
import { useDebounce } from './useDebounce';

interface UseTasksOptions {
  status:   TaskStatus | 'all';
  search:   string;
}

interface UseTasksReturn {
  tasks:   Task[];
  loading: boolean;
  error:   string | null;
}

export function useTasks({ status, search }: UseTasksOptions): UseTasksReturn {
  const { items, loading, error } = useTaskState();

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    let list = items;

    if (status !== 'all') {
      list = list.filter(t => t.status === status);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }

    return list;
  }, [items, status, debouncedSearch]);

  return { tasks: filtered, loading, error };
}

export function useFetchActions() {
  const fetchAll = useCallback(async (signal?: AbortSignal): Promise<Task[]> => {
    const res = await fetch('/api/tasks', { signal });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }, []);

  return { fetchAll };
}
