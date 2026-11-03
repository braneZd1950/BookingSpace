import { Link } from 'react-router-dom';
import './PlatformLegalStrip.scss';

/**
 * Compact platform legal links for authenticated workspaces
 * (owner studio tools / member app screens).
 * Public marketing + SiteFrame keep the full PlatformFooter.
 */
export default function PlatformLegalStrip({
  studioLinks = null,
  className = '',
}) {
  return (
    <footer className={`platform-legal-strip${className ? ` ${className}` : ''}`}>
      <div className="platform-legal-strip__inner">
        {studioLinks ? (
          <nav className="platform-legal-strip__nav" aria-label="Pravila studija">
            <span className="platform-legal-strip__kicker">Studio</span>
            <Link to={studioLinks.privacy}>Privatnost</Link>
            <span aria-hidden="true">·</span>
            <Link to={studioLinks.terms}>Uvjeti</Link>
            <span aria-hidden="true">·</span>
            <Link to={studioLinks.cookies}>Kolačići</Link>
          </nav>
        ) : null}
        <nav className="platform-legal-strip__nav" aria-label="Pravila platforme">
          <span className="platform-legal-strip__kicker">anyminutes</span>
          <Link to="/o-nama">O nama</Link>
          <span aria-hidden="true">·</span>
          <Link to="/privatnost">Privatnost</Link>
          <span aria-hidden="true">·</span>
          <Link to="/uvjeti">Uvjeti</Link>
          <span aria-hidden="true">·</span>
          <Link to="/kolacici">Kolačići</Link>
        </nav>
      </div>
    </footer>
  );
}
