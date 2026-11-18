import { Link } from 'react-router-dom';
import BrandWordmark from './BrandWordmark.jsx';
import { BRAND } from '../lib/brand.js';
import './PlatformFooter.scss';

const footerLinks = [
  ['/o-nama', 'O Blizariju'],
  ['/privatnost', 'Privatnost'],
  ['/uvjeti', 'Uvjeti korištenja'],
  ['/kolacici', 'Kolačići'],
  ['/kontakt', 'Kontakt'],
];

export default function PlatformFooter({
  credit = BRAND.name,
}) {
  const year = new Date().getFullYear();

  return (
    <div className="platform-foot">
      <div className="platform-foot__mesh" aria-hidden="true" />
      <div className="platform-foot__inner">
        <div className="platform-foot__brand">
          <Link className="platform-foot__wordmark" to="/" aria-label={BRAND.name}>
            <BrandWordmark slot="footer" tone="light" decorative />
          </Link>
          <p className="platform-foot__slogan">{BRAND.sloganHr}</p>
          <p className="platform-foot__blurb">
            Platforma za jednostavnije upravljanje uslužnim poslovanjem.
          </p>
        </div>

        <nav className="platform-foot__nav" aria-label="Navigacija podnožja">
          {footerLinks.map(([to, label]) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </nav>

        <p className="platform-foot__meta">
          ©
          {' '}
          {year}
          {' '}
          {credit}
          . Sva prava pridržana.
        </p>
      </div>
    </div>
  );
}
