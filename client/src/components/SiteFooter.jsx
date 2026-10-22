import { Link } from 'react-router-dom';
import { contactEmail } from '../contact.js';
import './SiteFooter.scss';

const groups = [
  {
    title: 'Račun',
    links: [
      { label: 'Prijava', to: '/login' },
      { label: 'Postanite partner', to: '/register' },
    ],
  },
  {
    title: 'Pravila',
    links: [
      { label: 'Privatnost', to: '/privatnost' },
      { label: 'Uvjeti korištenja', to: '/uvjeti' },
      { label: 'Kolačići', to: '/kolacici' },
    ],
  },
  {
    title: 'Kontakt',
    links: [
      { label: 'Javite nam se', to: '/kontakt' },
      { label: 'Povratna informacija', to: '/povratna-informacija' },
      { label: contactEmail, href: `mailto:${contactEmail}` },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <p className="site-footer__name">anyminutes</p>
            <p>
              Termini, paketi i članarine — za igraonice, studije i sva poslovanja
              koja žive od rasporeda.
            </p>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="site-footer__title">{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href}>{link.label}</a>
                    ) : (
                      <Link to={link.to}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="site-footer__note">© 2026 anyminutes</p>
      </div>
    </footer>
  );
}
