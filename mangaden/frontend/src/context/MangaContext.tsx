import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Manga } from '../types';

// ── PHASE 4: CONCEPT — useContext + useReducer ────────────────────────────────
//
// Problem: Library fetches the list. AddMangaModal needs to add to it.
// Without context, you'd pass state and callbacks through many layers — "prop drilling".
//
// Solution:
//   1. useReducer — like useState but for complex state with multiple actions.
//      Instead of `setState(newValue)`, you dispatch named actions.
//      The reducer is a PURE FUNCTION: (state, action) => newState.
//      Pure = same input always produces same output, no side effects.
//
//   2. createContext — creates a React Context object.
//      Wrap your tree in <MangaProvider> and any descendant can call
//      useMangaContext() to read the state and dispatch actions.
//      No prop threading needed.

// ── State shape ──────────────────────────────────────────────────────────────
interface MangaState {
  items:   Manga[];
  loading: boolean;
  error:   string | null;
}

// ── Action union type ─────────────────────────────────────────────────────────
// This is the "discriminated union" pattern — TypeScript narrows the type
// of `action.payload` based on `action.type`. Exhaustive switch handles all cases.
type MangaAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR';   payload: string | null }
  | { type: 'SET_LIST';    payload: Manga[] }
  | { type: 'ADD';         payload: Manga }
  | { type: 'UPDATE';      payload: Manga }
  | { type: 'REMOVE';      payload: string };  // payload = manga.id

// ── Reducer (pure function) ───────────────────────────────────────────────────
function mangaReducer(state: MangaState, action: MangaAction): MangaState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR':   return { ...state, error: action.payload, loading: false };
    case 'SET_LIST':    return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD':         return { ...state, items: [action.payload, ...state.items] };
    case 'UPDATE':      return {
      ...state,
      items: state.items.map(m => m.id === action.payload.id ? action.payload : m),
    };
    case 'REMOVE':      return {
      ...state,
      items: state.items.filter(m => m.id !== action.payload),
    };
    default: return state;
  }
}

const initialState: MangaState = { items: [], loading: false, error: null };

// ── Context ───────────────────────────────────────────────────────────────────
// We create TWO contexts: one for state, one for dispatch.
// This is a performance pattern: components that only dispatch don't re-render
// when state changes (because they're not subscribed to the state context).
const MangaStateContext    = createContext<MangaState | undefined>(undefined);
const MangaDispatchContext = createContext<React.Dispatch<MangaAction> | undefined>(undefined);

// ── Provider component ────────────────────────────────────────────────────────
// The "children" prop is of type ReactNode — any valid React subtree.
export function MangaProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mangaReducer, initialState);

  return (
    <MangaStateContext.Provider value={state}>
      <MangaDispatchContext.Provider value={dispatch}>
        {children}
      </MangaDispatchContext.Provider>
    </MangaStateContext.Provider>
  );
}

// ── Custom hook: useMangaState ────────────────────────────────────────────────
// Always access context through a custom hook — never use useContext directly.
// The hook validates that it's used inside the provider (throws otherwise).
export function useMangaState(): MangaState {
  const ctx = useContext(MangaStateContext);
  if (!ctx) throw new Error('useMangaState must be used inside <MangaProvider>');
  return ctx;
}

// ── Custom hook: useMangaDispatch ─────────────────────────────────────────────
export function useMangaDispatch(): React.Dispatch<MangaAction> {
  const ctx = useContext(MangaDispatchContext);
  if (!ctx) throw new Error('useMangaDispatch must be used inside <MangaProvider>');
  return ctx;
}
