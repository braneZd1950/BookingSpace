import { Link } from 'react-router-dom';
import { entityLine, legalEntity } from '../../lib/legal.js';
import './LegalPage.scss';

const docs = [
  { id: 'privatnost', label: 'Privatnost', to: '/privatnost' },
  { id: 'uvjeti', label: 'Uvjeti', to: '/uvjeti' },
  { id: 'kolacici', label: 'Kolačići', to: '/kolacici' },
];

function ClauseBody({ section }) {
  return (
    <div className="legal__copy">
      <h2>{section.title}</h2>
      {section.summary ? (
        <p className="legal__summary">
          <span>Ukratko</span>
          {section.summary}
        </p>
      ) : null}
      {(section.paragraphs || []).map((text) => (
        <p key={text}>{text}</p>
      ))}
      {section.bullets?.length ? (
        <ul className="legal__bullets">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.note ? <p className="legal__note">{section.note}</p> : null}
      {section.law ? <p className="legal__law">{section.law}</p> : null}
    </div>
  );
}

export default function LegalPage({
  docId,
  title,
  lead,
  basis,
  updated = '13. 10. 2026.',
  updatedIso = '2026-10-13',
  sections,
}) {
  return (
    <main className="legal">
      <div className="legal__wash" aria-hidden="true" />

      <header className="legal__hero">
        <p className="legal__brand">{legalEntity.productName}</p>
        <p className="legal__kicker">Jasna pravila · RH i EU</p>
        <h1>{title}</h1>
        <p className="legal__lead">{lead}</p>
        {basis ? <p className="legal__basis">{basis}</p> : null}
        <p className="legal__meta">
          Na snazi od
          {' '}
          <time dateTime={updatedIso}>{updated}</time>
        </p>
      </header>

      <nav className="legal__tabs" aria-label="Pravni dokumenti">
        {docs.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={item.id === docId ? 'is-on' : undefined}
            aria-current={item.id === docId ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="legal__sheet">
        <aside className="legal__id" aria-label="Tko stoji iza usluge">
          <p className="legal__aside-label">Tko stoji iza usluge</p>
          <p>{entityLine()}</p>
          <p className="legal__id-note">
            {legalEntity.productName}
            {' '}
            je alat za rezervacije. Studio nudi termin ili članstvo;
            mi držimo tehniku. Svi — vi, studio i mi — imamo svoja prava i
            obveze po hrvatskom i europskom pravu.
          </p>
        </aside>

        <ol className="legal__list">
          {sections.map((section, index) => (
            <li key={section.title} className="legal__clause" id={section.id || undefined}>
              <span className="legal__index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <ClauseBody section={section} />
            </li>
          ))}
        </ol>

        <aside className="legal__aside" aria-label="Tko je za što odgovoran">
          <p className="legal__aside-label">Tko je za što odgovoran</p>
          <div className="legal__roles">
            <div>
              <strong>Vi (član / gost)</strong>
              <span>
                Čuvate svoj račun, dolazite na termin ili ga otkažete na vrijeme,
                prema pravilima studija.
              </span>
            </div>
            <div>
              <strong>Studio (partner)</strong>
              <span>
                Odgovara za uslugu, cijene, članstvo, rok otkaza i odnos s vama.
                U pravilu je voditelj obrade podataka svojih članova.
              </span>
            </div>
            <div>
              <strong>
                {legalEntity.productName}
                {' '}
                (platforma)
              </strong>
              <span>
                Odgovara za rad aplikacije i tehničku obradu podataka potrebnih
                za prijavu i rezervaciju. Ne izvršava trening ni tretman umjesto
                studija.
              </span>
            </div>
          </div>
        </aside>

        <footer className="legal__closing">
          <p>
            Primjenjuje se pravo Republike Hrvatske i neposredno pravo EU
            (uključujući GDPR). Sporove rješavaju sudovi u RH, uz zaštitu koja
            potrošačima pripada po zakonu.
          </p>
          <p>
            Pitanja o ovim pravilima:
            {' '}
            <a href={`mailto:${legalEntity.email}`}>{legalEntity.email}</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
