import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import { MangaProvider } from './context/MangaContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import Library from './pages/Library';
import MangaDetail from './pages/MangaDetail';

// ── CONCEPT: React.lazy + Suspense — Code Splitting ───────────────────────────
//
// By default, Vite bundles ALL your code into one file.
// For large apps, this means users download code for pages they haven't visited.
//
// React.lazy(() => import('./pages/StatsPage')) tells Vite to split StatsPage
// into a SEPARATE chunk. It's only downloaded when the user navigates to /stats.
//
// This is called "route-level code splitting" — one of the most impactful
// performance optimizations you can apply.
//
// React.lazy requires a DEFAULT export from the imported module.
// The component must be wrapped in <Suspense fallback={...}> which renders
// while the chunk is being downloaded.
const StatsPage = lazy(() => import('./pages/StatsPage'));

// ── Suspense fallback ─────────────────────────────────────────────────────────
// Suspense catches the "pending" state of lazy-loaded components.
// The fallback renders while the chunk loads (usually < 100ms on fast networks).
// You can nest Suspense to have different fallbacks for different sections.
function PageFallback() {
  return (
    <div className="detail-loading">
      <div className="detail-loading__spinner" />
      <p>Loading page…</p>
    </div>
  );
}

// ── Page transition variants (unchanged) ─────────────────────────────────────
const pageVariants = {
  hidden:  { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ── CONCEPT: Suspense placement ───────────────────────────────────
            Suspense must be an ANCESTOR of the lazy component.
            We place it here so every route benefits from the fallback,
            without having to wrap each lazy import individually.         */}
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function RootLayout() {
  return (
    <>
      <Navbar />
      <AnimatedOutlet />
    </>
  );
}

// ── CONCEPT: Route configuration — adding the /stats route ────────────────────
// Adding a new page = add one object here. No wiring in components needed.
// The router is the single source of truth for the app's URL structure.
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true,        element: <Library /> },
      { path: 'manga/:id',  element: <MangaDetail /> },
      { path: 'stats',      element: <StatsPage /> },
    ],
  },
]);

// ── CONCEPT: Provider composition order matters ────────────────────────────────
// Providers wrap children — the outermost provider is available to all descendants.
// ThemeProvider goes outside ToastProvider so ToastProvider (and its portal)
// can read the theme. MangaProvider is inside because it depends on nothing else.
//
// The pattern: <Outermost> → <Middle> → <Inner> → <App content>
// Read it as: ThemeProvider provides the visual theme to everything,
// ToastProvider provides the toast API to everything,
// MangaProvider provides manga data to everything.
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MangaProvider>
          <RouterProvider router={router} />
        </MangaProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
