import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ── PHASE 7: CONCEPT — Dedicated Context for cross-cutting concerns ────────────
//
// "Cross-cutting concern" = something that many unrelated components need,
// like auth state, theme, or locale. Creating a dedicated context (rather than
// lumping everything into MangaContext) keeps each context focused.
//
// Pattern: Provider → exposes value → consumers call useTheme() hook.
// The hook throws if used outside the Provider — early, clear error vs. silent bug.

// ── CONCEPT: Type for context value ───────────────────────────────────────────
// We export this interface so other files can import just the type without
// importing the whole context module (useful for large apps).
export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ── CONCEPT: Initializer function for useState ─────────────────────────────────
// useState(initialValue) runs on every render but only uses the value on mount.
// useState(initFn) — passing a FUNCTION — only calls initFn once on mount.
// This is called "lazy initialization" and is critical for expensive operations
// like reading localStorage or parsing JSON. If you wrote useState(readStorage())
// the read would happen on EVERY render, even though it's ignored.
function getInitialTheme(): Theme {
  // typeof window check is defensive — in SSR environments there is no window.
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('mangaden-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  // Respect the OS-level preference if no stored preference exists.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ── CONCEPT: Lazy state initialization ────────────────────────────────────
  // Note: we pass getInitialTheme (the function itself, no parentheses).
  // React calls it ONCE on mount. Subsequent renders skip it.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // ── CONCEPT: useEffect for DOM side-effects ────────────────────────────────
  // React renders are PURE — the render function must not touch the DOM.
  // DOM mutations (setting a data-attribute, calling document.something)
  // are side-effects and belong in useEffect.
  //
  // This effect runs once on mount AND whenever `theme` changes.
  // It syncs the React state to two external systems:
  //   1. The <html> element's data-theme attribute (CSS reads this)
  //   2. localStorage (persists across page reloads)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mangaden-theme', theme);
  }, [theme]); // dep = theme → effect only re-runs when theme changes

  const toggleTheme = () =>
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Custom hook ───────────────────────────────────────────────────────────────
// Always expose context through a custom hook.
// Benefits:
//   - Consumers import one name, not two (ThemeContext AND useContext)
//   - Validation: throws if used outside provider
//   - Easier to mock in tests
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
