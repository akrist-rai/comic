import { useState, useCallback, useMemo } from 'react';
import type { Manga } from '../types';
import { useMangaState } from '../context/MangaContext';
import { useDebounce } from './useDebounce';

// ── PHASE 6: CONCEPT — Custom Hooks ──────────────────────────────────────────
// A custom hook is just a function whose name starts with "use" and that calls
// other hooks inside. It extracts stateful logic from components into reusable units.
//
// Rules it must follow (same as any hook):
//   1. Only call hooks at the top level (not inside loops or conditions)
//   2. Only call hooks from React functions (components or custom hooks)
//
// useManga encapsulates all data-fetching logic.
// Components call it and get back { manga, loading, error } — clean and composable.

type FilterStatus = import('../components/FilterBar').FilterStatus;

interface UseMangaOptions {
  status: FilterStatus;
  search: string;
  type:   string;
}

interface UseMangaReturn {
  manga:   Manga[];
  loading: boolean;
  error:   string | null;
}

export function useManga({ status, search, type }: UseMangaOptions): UseMangaReturn {
  const { items, loading, error } = useMangaState();

  // ── CONCEPT: useDebounce inside a custom hook ─────────────────────────────
  // We debounce the search so we don't filter on every keystroke.
  // useDebounce is itself a custom hook — hooks composing hooks.
  const debouncedSearch = useDebounce(search, 300);

  // ── CONCEPT: useMemo ───────────────────────────────────────────────────────
  // useMemo(fn, deps) memoizes the result of fn.
  // fn only re-runs when a dep changes. If status and search are the same,
  // React returns the cached array — no new reference, no child re-renders
  // caused by the array identity changing.
  //
  // When to use: expensive computation OR when the result is used in another
  // hook/component that does referential equality checks (React.memo, useEffect deps).
  const filtered = useMemo(() => {
    let list = items;

    if (status !== 'all') {
      list = list.filter(m => m.status === status);
    }

    if (type !== 'all') {
      list = list.filter(m => m.type === type);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q))
      );
    }

    return list;
  }, [items, status, type, debouncedSearch]);

  return { manga: filtered, loading, error };
}

// ── CONCEPT: useCallback ───────────────────────────────────────────────────────
// useCallback(fn, deps) memoizes a function reference.
// Without it, every render creates a NEW function object.
// If that function is passed as a prop to a child wrapped in React.memo,
// the child re-renders anyway because the prop reference changed.
//
// Example usage (exported for Library to use):
export function useFetchActions() {
  const fetchAll = useCallback(async (signal?: AbortSignal): Promise<Manga[]> => {
    const res = await fetch('/api/manga', { signal });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, []); // No deps — this function never needs to change

  return { fetchAll };
}
