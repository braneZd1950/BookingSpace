import { Link } from 'react-router-dom';
import './PlatformFooter.scss';

export default function PlatformFooter({
  credit = 'anyminutes',
  onHomeClick,
}) {
  const year = new Date().getFullYear();

  return (
    <div className="platform-foot">
      <div className="platform-foot__mesh" aria-hidden="true" />
      <div className="platform-foot__inner">
        <div className="platform-foot__brand">
          <Link
            className="platform-foot__wordmark"
            to="/"
            onClick={onHomeClick}
          >
            anyminutes
          </Link>
          <p>
            Pravna podrška platforme — privatnost, uvjeti i kolačići usluge
            kojom studio vodi rezervacije.
          </p>
        </div>

        <nav className="platform-foot__nav" aria-label="Pravila platforme">
          <Link to="/privatnost">
            <span className="platform-foot__index">01</span>
            Privatnost
          </Link>
          <Link to="/uvjeti">
            <span className="platform-foot__index">02</span>
            Uvjeti korištenja
          </Link>
          <Link to="/kolacici">
            <span className="platform-foot__index">03</span>
            Kolačići
          </Link>
        </nav>

        <p className="platform-foot__meta">
          ©
          {' '}
          {year}
          {' '}
          {credit}
        </p>
      </div>
    </div>
  );
}
