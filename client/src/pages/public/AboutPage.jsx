import { Link } from 'react-router-dom';
import BrandWordmark from '../../components/BrandWordmark.jsx';
import SeoHead from '../../components/SeoHead.jsx';
import { contactEmail } from '../../lib/contact.js';
import { organizationJsonLd } from '../../lib/seo.js';
import './AboutPage.scss';

const promises = [
  {
    title: 'Jednostavnost na prvom mjestu',
    text: 'Želim da Blizari bude razumljiv i jednostavan za korištenje. Ako nešto nije jasno, to je znak da trebam pronaći bolje rješenje.',
  },
  {
    title: 'Vaše poslovanje ostaje vaše',
    text: 'Vaša stranica, vaši klijenti i odnosi koje gradite pripadaju vama. Blizari vam pruža alate za organizaciju i upravljanje, bez preuzimanja vašeg poslovanja.',
  },
  {
    title: 'Vaše mišljenje je važno',
    text: 'Slušam prijedloge, pitanja, kritike i ideje. Povratne informacije korisnika nisu samo komentari — one pomažu odrediti što ću razvijati sljedeće.',
  },
  {
    title: 'Iskrenost bez velikih obećanja',
    text: 'Ne želim obećavati ono što još ne postoji. Blizari se razvija korak po korak i želim otvoreno komunicirati što je dostupno, što se mijenja i što tek dolazi.',
  },
];

function AboutMark({ type }) {
  const common = {
    className: 'about__mark-icon',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  };

  if (type === 'who') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8.2" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          d="M5.8 18.4c1.1-3 3.2-4.5 6.2-4.5s5.1 1.5 6.2 4.5"
        />
      </svg>
    );
  }

  if (type === 'why') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M12 8.2v4.1l2.7 1.6" />
      </svg>
    );
  }

  if (type === 'build') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.5 16.5 12 5.8l6.5 10.7H5.5Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M12 10.2v3.2M12 15.8h.01" />
      </svg>
    );
  }

  if (type === 'promise') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3.9 5.9 6.4v4.1c0 4 2.7 7 6.1 8.4 3.4-1.4 6.1-4.4 6.1-8.4V6.4L12 3.9Z"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12.2h14M12.2 5.5 18.7 12l-6.5 6.5"
      />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="about">
      <SeoHead
        title="O nama — Blizari"
        description="Blizari je nastao iz stvarnog problema: termini, rezervacije i klijenti u bilježnicama i porukama. Gradimo jednostavan alat za uslužna poslovanja."
        path="/o-nama"
        jsonLd={organizationJsonLd()}
      />
      <div className="about__atmosphere" aria-hidden="true">
        <span className="about__orb about__orb--a" />
        <span className="about__orb about__orb--b" />
        <span className="about__grain" />
        <span className="about__watermark">
          <BrandWordmark slot="watermark" tone="dark" decorative />
        </span>
      </div>

      <div className="about__shell">
        <header className="about__hero">
          <p className="about__brand">
            <BrandWordmark slot="page" tone="dark" />
          </p>
          <h1>O nama</h1>
          <p className="about__subtitle">
            Jedna ideja i želja da vođenje poslovanja bude jednostavnije.
          </p>
        </header>

        <section className="about__section" aria-labelledby="about-start">
          <div className="about__section-head">
            <span className="about__section-icon" aria-hidden="true">
              <AboutMark type="start" />
            </span>
            <div>
              <p className="about__kicker">Kako je sve počelo</p>
              <h2 id="about-start">Blizari je nastao iz jednog stvarnog problema.</h2>
            </div>
          </div>
          <div className="about__prose">
            <p>
              Mnogi vlasnici poslovanja i dalje vode termine, rezervacije i podatke o
              klijentima kroz bilježnice, papire, poruke i različite alate. Sve to
              oduzima vrijeme, stvara nepotrebnu zbrku i otežava svakodnevni rad.
            </p>
            <p className="about__pull">
              Promatrajući to, shvatio sam da postoji bolji način.
            </p>
            <p>
              Poželio sam stvoriti alat koji će biti pregledan, jednostavan i praktičan
              za korištenje — tako da ne morate trošiti vrijeme na učenje kompliciranog
              sustava, već se možete posvetiti svom poslu.
            </p>
            <p>Tako je nastala ideja o Blizariju.</p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-who">
          <div className="about__section-head">
            <span className="about__section-icon" aria-hidden="true">
              <AboutMark type="who" />
            </span>
            <div>
              <p className="about__kicker">Tko stoji iza Blizaria</p>
              <h2 id="about-who">Za sada, Blizari gradim sam.</h2>
            </div>
          </div>
          <div className="about__prose">
            <p>
              Iza Blizaria ne stoji veliki tim ni investitori. Stojim ja, s idejom,
              puno učenja, rada i željom da stvorim nešto što će ljudima zaista
              koristiti.
            </p>
            <p>
              To mi omogućuje da budem blizu korisnika, slušam njihove potrebe i
              razvijam Blizari bez nepotrebnih komplikacija. Svaki razgovor, prijedlog
              i iskustvo mogu pomoći da platforma postane bolja.
            </p>
            <p className="about__pull">
              Ne želim graditi proizvod samo zato što mislim da nešto treba postojati.
              Želim graditi ono što ljudima stvarno treba.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-why">
          <div className="about__section-head">
            <span className="about__section-icon" aria-hidden="true">
              <AboutMark type="why" />
            </span>
            <div>
              <p className="about__kicker">Zašto radim ovo</p>
              <h2 id="about-why">Vaše vrijeme vrijedi više od administracije.</h2>
            </div>
          </div>
          <div className="about__prose">
            <p>
              Vjerujem da vlasnici poslovanja ne bi trebali provoditi sate
              organizirajući termine, odgovarajući na poruke i tražeći informacije
              koje bi trebali imati na jednom mjestu.
            </p>
            <p>
              Zato gradim Blizari — kako bih svakodnevno vođenje poslovanja učinio
              preglednijim, organiziranijim i jednostavnijim.
            </p>
            <p>
              Želim da imate više vremena za svoje klijente, svoj posao i sebe, a
              manje vremena za administraciju.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-build">
          <div className="about__section-head">
            <span className="about__section-icon" aria-hidden="true">
              <AboutMark type="build" />
            </span>
            <div>
              <p className="about__kicker">Kako gradim Blizari</p>
              <h2 id="about-build">Razvijam ga zajedno s ljudima koji ga koriste.</h2>
            </div>
          </div>
          <div className="about__prose">
            <p>
              Blizari ne želim razvijati izolirano, prema vlastitim pretpostavkama.
              Želim razgovarati s vlasnicima poslovanja, upoznati njihov način rada i
              razumjeti što im zaista predstavlja problem.
            </p>
            <p>
              Nove mogućnosti uvodim s ciljem da riješe stvarne potrebe, a ne da
              aplikacija postane veća i kompliciranija bez razloga.
            </p>
            <p>
              Moji prvi korisnici imaju posebno važnu ulogu u tom procesu. Njihovo
              iskustvo, povratne informacije i prijedlozi izravno utječu na smjer u
              kojem će se Blizari dalje razvijati.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-promise">
          <div className="about__section-head">
            <span className="about__section-icon" aria-hidden="true">
              <AboutMark type="promise" />
            </span>
            <div>
              <p className="about__kicker">Moje obećanje</p>
              <h2 id="about-promise">Što možete očekivati od Blizaria</h2>
            </div>
          </div>
          <ul className="about__promises">
            {promises.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about__close" aria-labelledby="about-close">
          <p className="about__kicker">Krenimo zajedno</p>
          <h2 id="about-close">Blizari je tek na početku.</h2>
          <div className="about__prose">
            <p>
              Gradim Blizari s idejom da s vremenom postane koristan alat za što više
              različitih poslovanja. Svaki novi korisnik, razgovor i iskustvo prilika
              su da napravim nešto bolje.
            </p>
            <p>
              Ako vodite svoje poslovanje i želite jednostavnije organizirati termine,
              rezervacije i klijente, volio bih da isprobate Blizari.
            </p>
            <p>
              Ako imate pitanje, ideju ili prijedlog, slobodno mi se javite. Iza
              Blizaria stoji stvarna osoba koja će pročitati vašu poruku.
            </p>
          </div>
          <p className="about__contact">
            Kontakt:
            {' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
          <div className="about__actions">
            <Link className="about__cta" to="/register">
              Napravite svoju stranicu
            </Link>
            <Link className="about__cta about__cta--ghost" to="/">
              Natrag na početnu
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
