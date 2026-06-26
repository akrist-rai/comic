import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// ── PHASE 5: CONCEPT — React Router NavLink ───────────────────────────────────
// <Link> renders an <a> tag that navigates WITHOUT a full page reload.
// React Router intercepts the click, updates the URL, and re-renders the
// matching route component — all client-side. That's what makes it an SPA.
//
// useLocation() returns the current URL object. We use it to determine
// if we're on the library page to show/hide the back button.

// ── PHASE 7 (NEW): CONCEPT — Consuming a context in a component ───────────────
// We call useTheme() — that's it. The component subscribes to ThemeContext.
// When theme changes, ONLY components that call useTheme() re-render.
// Components that don't call it are unaffected — this is context's performance model.

export function Navbar() {
  const location  = useLocation();
  const isDetail  = location.pathname.startsWith('/manga/');
  const isStats   = location.pathname === '/stats';

  // ── Context consumption ───────────────────────────────────────────────────
  // theme = 'dark' | 'light'. toggleTheme = () => void.
  // When toggleTheme is called, ThemeProvider updates state → CSS data-theme changes
  // → all CSS custom property overrides take effect → visual update.
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        Manga<span>Den</span>
      </Link>

      <div className="navbar__links">
        {/* ── CONCEPT: Active link styling via comparison ───────────────────
            We compare location.pathname to know which link is "active".
            React Router's <NavLink> does this automatically, but manual
            comparison shows the underlying concept more clearly. */}
        <Link
          to="/"
          className={`navbar__link ${!isDetail && !isStats ? 'navbar__link--active' : ''}`}
        >
          Library
        </Link>
        <Link
          to="/stats"
          className={`navbar__link ${isStats ? 'navbar__link--active' : ''}`}
        >
          Stats
        </Link>
      </div>

      <div className="navbar__actions">
        {/* ── CONCEPT: Event handler inline vs extracted ────────────────────
            Small one-liners are fine inline. If the logic grew (e.g. debounce,
            analytics tracking), extract to a named handler for readability. */}
        <button
          className="navbar__theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isDetail && (
          <Link to="/" className="navbar__back">
            ← Library
          </Link>
        )}
      </div>
    </nav>
  );
}
