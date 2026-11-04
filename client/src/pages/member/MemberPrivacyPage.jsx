import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useGetMeQuery, useUpdateMeMutation } from '../../api/authApi.js';
import PrivacyConsentPanel from '../../components/PrivacyConsentPanel.jsx';
import UiThemePicker from '../../components/UiThemePicker.jsx';
import { normalizeUiTheme, syncUiTheme } from '../../lib/uiTheme.js';
import './MemberPrivacyPage.scss';

export default function MemberPrivacyPage() {
  const { tenant, loggedIn } = useOutletContext();
  const base = `/s/${tenant.slug}`;
  const { data: meData } = useGetMeQuery(undefined, { skip: !loggedIn });
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const [uiTheme, setUiTheme] = useState('system');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!meData?.user) return;
    setUiTheme(normalizeUiTheme(meData.user.uiTheme));
  }, [meData?.user]);

  async function saveUiTheme(next) {
    const theme = normalizeUiTheme(next);
    setUiTheme(theme);
    syncUiTheme(theme);
    setNote('');
    try {
      await updateMe({ uiTheme: theme }).unwrap();
      setNote(theme === 'dark'
        ? 'Tamna tema je spremljena.'
        : theme === 'light'
          ? 'Svijetla tema je spremljena.'
          : 'Tema prati postavke uređaja.');
    } catch {
      setNote('Tema nije spremljena na račun — ostaje lokalno na ovom uređaju.');
    }
  }

  if (!loggedIn) {
    return (
      <main className="member-privacy">
        <h1>Privatnost</h1>
        <p>
          Prijavite se da upravljate privolom i temom sučelja.
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
          <h1>Privatnost i izgled</h1>
          <p>
            Privola i tema sučelja za
            {' '}
            {tenant.name}
            {' '}
            i anyminutes.
          </p>
        </div>
        <Link to={base}>Natrag</Link>
      </header>

      <section className="member-privacy__sheet">
        <UiThemePicker
          value={uiTheme}
          onChange={saveUiTheme}
          disabled={isLoading}
        />
        {note ? <p className="member-privacy__note">{note}</p> : null}
      </section>

      <section className="member-privacy__sheet">
        <PrivacyConsentPanel />
      </section>
    </main>
  );
}
