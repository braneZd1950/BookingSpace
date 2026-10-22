import { Link, useOutletContext } from 'react-router-dom';
import PrivacyConsentPanel from '../../components/PrivacyConsentPanel.jsx';
import './MemberPrivacyPage.scss';

export default function MemberPrivacyPage() {
  const { tenant, loggedIn } = useOutletContext();
  const base = `/s/${tenant.slug}`;

  if (!loggedIn) {
    return (
      <main className="member-privacy">
        <h1>Privatnost</h1>
        <p>
          Prijavite se da upravljate privolom.
          {' '}
          <Link to="/login">Prijava</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="member-privacy">
      <header className="member-privacy__head">
        <div>
          <h1>Privatnost</h1>
          <p>
            Privola za
            {' '}
            {tenant.name}
            {' '}
            i anyminutes — možete je dati ili povući u svakom trenutku.
          </p>
        </div>
        <Link to={base}>Natrag</Link>
      </header>

      <section className="member-privacy__sheet">
        <PrivacyConsentPanel />
      </section>
    </main>
  );
}
