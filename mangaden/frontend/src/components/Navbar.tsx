import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/manga/');
  const isStats  = location.pathname === '/stats';
  const isHome   = !isDetail && !isStats;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        Manga<span>den</span>
      </Link>

      <div className="navbar__links">
        <Link to="/" className={`navbar__link ${isHome ? 'navbar__link--active' : ''}`}>
          Library
        </Link>
        <Link to="/stats" className={`navbar__link ${isStats ? 'navbar__link--active' : ''}`}>
          Stats
        </Link>
      </div>

      <div className="navbar__actions">
        {isDetail && (
          <Link to="/" className="navbar__back">
            ← Library
          </Link>
        )}
      </div>
    </nav>
  );
}
