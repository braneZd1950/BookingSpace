import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useUpdateSiteMutation } from '../../api/tenantApi.js';
import PlatformFooter from '../../components/PlatformFooter.jsx';
import PrivacyConsentPanel from '../../components/PrivacyConsentPanel.jsx';
import { generateAllStudioLegal, legalBody, paragraphsFromLegal } from '../owner/studioLegal.js';
import './StudioPolicyPage.scss';

const META = {
  privacy: {
    kicker: 'Dokument 01',
    title: 'Politika privatnosti',
    lead: 'Kako ovaj studio obrađuje podatke klijenata i članova.',
  },
  terms: {
    kicker: 'Dokument 02',
    title: 'Uvjeti korištenja',
    lead: 'Pravila rezervacija, članarina i korištenja stranice studija.',
  },
  cookies: {
    kicker: 'Dokument 03',
    title: 'Kolačići',
    lead: 'Što se sprema u pregledniku radi prijave i rada rezervacija.',
  },
};

const DOCS = [
  { kind: 'privacy', index: '01', label: 'Privatnost', to: 'privatnost' },
  { kind: 'terms', index: '02', label: 'Uvjeti', to: 'uvjeti' },
  { kind: 'cookies', index: '03', label: 'Kolačići', to: 'kolacici' },
];

const REAL_ID = /^[a-f\d]{24}$/i;

function renderLine(line, index) {
  if (index === 0) {
    return <h2 key={`h-${index}`}>{line}</h2>;
  }

  const section = line.match(/^(\d+)\.\s*(.*)$/);
  if (section) {
    return (
      <h3 key={`s-${index}`}>
        <span className="studio-policy__sec-index" aria-hidden="true">
          {section[1].padStart(2, '0')}
        </span>
        <span>{section[2]}</span>
      </h3>
    );
  }

  return <p key={`p-${index}`}>{line}</p>;
}

function legalBundle(tenant) {
  return {
    privacy: legalBody(tenant, 'privacy'),
    terms: legalBody(tenant, 'terms'),
    cookies: legalBody(tenant, 'cookies'),
  };
}

export default function StudioPolicyPage({ kind = 'privacy' }) {
  const { tenant, loggedIn, session, palette } = useOutletContext();
  const meta = META[kind] || META.privacy;
  const base = `/s/${tenant.slug}`;
  const theme = palette?.theme;
  const canEdit = loggedIn
    && session?.role === 'BUSINESS_OWNER'
    && REAL_ID.test(String(tenant.id || ''));
  const [updateSite, { isLoading: saving }] = useUpdateSiteMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => legalBody(tenant, kind));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [localLegal, setLocalLegal] = useState(() => legalBundle(tenant));

  useEffect(() => {
    setLocalLegal(legalBundle(tenant));
    if (!editing) setDraft(legalBody(tenant, kind));
  }, [tenant, kind, editing]);

  useEffect(() => {
    if (!confirmOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape' && !saving) setConfirmOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen, saving]);

  const bodyText = editing ? draft : (localLegal[kind] || legalBody(tenant, kind));
  const lines = paragraphsFromLegal(bodyText);
  const custom = Boolean(tenant.siteSettings?.legal?.[kind]?.trim?.())
    || Boolean(localLegal[kind] && tenant.siteSettings?.legal?.updatedAt);

  function startEdit() {
    setDraft(localLegal[kind] || legalBody(tenant, kind));
    setEditing(true);
    setNotice('');
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(localLegal[kind] || legalBody(tenant, kind));
    setConfirmOpen(false);
    setNotice('');
  }

  function refillDraft() {
    const generated = generateAllStudioLegal({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
    });
    setDraft(generated[kind] || '');
  }

  function requestSave(event) {
    event.preventDefault();
    if (!draft.trim()) {
      setNotice('Tekst ne smije biti prazan.');
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSave() {
    const nextLegal = {
      privacy: kind === 'privacy' ? draft.trim() : (localLegal.privacy || legalBody(tenant, 'privacy')),
      terms: kind === 'terms' ? draft.trim() : (localLegal.terms || legalBody(tenant, 'terms')),
      cookies: kind === 'cookies' ? draft.trim() : (localLegal.cookies || legalBody(tenant, 'cookies')),
    };
    try {
      const result = await updateSite({
        id: tenant.id,
        body: { legal: nextLegal },
      }).unwrap();
      const saved = result.tenant?.siteSettings?.legal || {
        ...nextLegal,
        updatedAt: new Date().toISOString(),
      };
      setLocalLegal({
        privacy: saved.privacy || nextLegal.privacy,
        terms: saved.terms || nextLegal.terms,
        cookies: saved.cookies || nextLegal.cookies,
      });
      setEditing(false);
      setConfirmOpen(false);
      setNotice('Izmjene su spremljene u bazu i na stranicu.');
      if (result.tenant) {
        Object.assign(tenant, result.tenant);
        if (result.tenant.siteSettings) {
          tenant.siteSettings = result.tenant.siteSettings;
        }
      }
    } catch {
      setConfirmOpen(false);
      setNotice('Spremanje nije uspjelo. Pokušajte ponovno.');
    }
  }

  return (
    <main
      className="studio-policy"
      style={theme ? {
        '--policy-brand': theme.primaryColor,
        '--policy-soft': theme.secondaryColor,
        '--policy-ink': theme.ink,
        '--policy-canvas': theme.canvas,
      } : undefined}
    >
      <div className="studio-policy__atmosphere" aria-hidden="true">
        <span className="studio-policy__wash" />
        <span className="studio-policy__grain" />
      </div>

      <div className="studio-policy__layout">
        <aside className="studio-policy__rail">
          <p className="studio-policy__rail-label">Pravila</p>
          <nav className="studio-policy__index" aria-label="Dokumenti studija">
            {DOCS.map((doc) => (
              <Link
                key={doc.kind}
                to={`${base}/${doc.to}`}
                className={kind === doc.kind ? 'is-active' : undefined}
                aria-current={kind === doc.kind ? 'page' : undefined}
              >
                <span className="studio-policy__index-num">{doc.index}</span>
                <span>{doc.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="studio-policy__stage">
          <header className="studio-policy__hero">
            <p className="studio-policy__studio">{tenant.name}</p>
            <p className="studio-policy__kicker">{meta.kicker}</p>
            <h1>{meta.title}</h1>
            <p className="studio-policy__lead">{meta.lead}</p>
          </header>

          {canEdit ? (
            <div className="studio-policy__owner">
              {!editing ? (
                <button type="button" className="studio-policy__owner-btn" onClick={startEdit}>
                  Uredi ovaj dokument
                </button>
              ) : (
                <p className="studio-policy__owner-note">
                  Uređujete tekst studija. Nakon spremanja bit će u bazi i javno vidljiv.
                </p>
              )}
              <Link className="studio-policy__owner-link" to="/stranica/postavke">
                Sva pravila u postavkama
              </Link>
            </div>
          ) : null}

          {notice ? (
            <p className="studio-policy__notice" role="status">{notice}</p>
          ) : null}

          {editing ? (
            <form className="studio-policy__editor" onSubmit={requestSave}>
              <div className="studio-policy__editor-tools">
                <button type="button" className="studio-policy__ghost" onClick={refillDraft}>
                  Vrati predložak
                </button>
                <button type="button" className="studio-policy__ghost" onClick={cancelEdit}>
                  Odustani
                </button>
              </div>
              <label>
                <span className="visually-hidden">{meta.title}</span>
                <textarea
                  rows={16}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  spellCheck="true"
                />
              </label>
              <button type="submit" className="studio-policy__save" disabled={saving}>
                {saving ? 'Spremamo…' : 'Spremi u bazu'}
              </button>
            </form>
          ) : (
            <article className="studio-policy__doc">
              <p className="studio-policy__source">
                {custom
                  ? 'Tekst studija (spremljen u bazi — vlasnik može urediti)'
                  : 'Ugrađeni predložak GDPR / RH — vlasnik ga može urediti i spremiti'}
              </p>
              <div className="studio-policy__body">
                {lines.map(renderLine)}
              </div>
            </article>
          )}

          {kind === 'privacy' && loggedIn && !editing ? (
            <section className="studio-policy__consent" aria-label="Vaša privola">
              <PrivacyConsentPanel />
            </section>
          ) : null}

          <p className="studio-policy__back">
            <Link to={base}>Natrag na {tenant.name}</Link>
          </p>
        </div>
      </div>

      {confirmOpen ? (
        <div
          className="studio-policy__modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) setConfirmOpen(false);
          }}
        >
          <div
            className="studio-policy__modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-policy-confirm-title"
          >
            <h2 id="studio-policy-confirm-title">Spremiti izmjene?</h2>
            <p>
              Jeste li sigurni da želite spremiti izmjene dokumenta „
              {meta.title}
              ” u bazu? Tekst će odmah biti javno vidljiv na stranici studija.
            </p>
            <div className="studio-policy__modal-actions">
              <button
                type="button"
                className="studio-policy__ghost"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
              >
                Odustani
              </button>
              <button
                type="button"
                className="studio-policy__save"
                disabled={saving}
                onClick={confirmSave}
              >
                {saving ? 'Spremamo…' : 'Da, spremi'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PlatformFooter credit={tenant.name} />
    </main>
  );
}
