import { Link } from 'react-router-dom';
import { contactEmail } from '../../lib/contact.js';
import './AboutPage.scss';

const promises = [
  {
    title: 'Jednostavnost na prvom mjestu',
    text: 'Ako nešto nije jasno odmah, to je moj posao da popravim.',
  },
  {
    title: 'Vaš posao ostaje vaš',
    text: 'Vaša stranica, vaši klijenti i vaši odnosi pripadaju vama. Ja dajem samo alate.',
  },
  {
    title: 'Slušam vas',
    text: 'Vaše poruke i ideje izravno utječu na to što dolazi sljedeće.',
  },
  {
    title: 'Bez praznih priča',
    text: 'Govorim vam što aplikacija radi danas, iskreno i bez pretjerivanja.',
  },
];

export default function AboutPage() {
  return (
    <main className="about">
      <div className="about__atmosphere" aria-hidden="true">
        <span className="about__orb about__orb--a" />
        <span className="about__orb about__orb--b" />
        <span className="about__grain" />
        <span className="about__watermark">anyminutes</span>
      </div>

      <div className="about__shell">
        <header className="about__hero">
          <p className="about__brand">anyminutes</p>
          <h1>O nama</h1>
          <p className="about__subtitle">
            Jedna ideja i želja da vođenje posla bude jednostavnije.
          </p>
        </header>

        <section className="about__section" aria-labelledby="about-start">
          <p className="about__kicker">Kako je sve počelo</p>
          <h2 id="about-start">AnyMinutes je počeo od jednog vrlo stvarnog problema.</h2>
          <div className="about__prose">
            <p>
              Mnogi vlasnici malih poslova svoje termine i klijente još uvijek vode
              po papirima, bilježnicama i porukama. To oduzima vrijeme, stvara zbrku
              i lako se nešto izgubi.
            </p>
            <p>
              Gledajući to iz blizine, shvatio sam da može i jednostavnije. Htio sam
              napraviti alat koji je pregledan, osoban i lak za korištenje — takav da
              ga uključite i odmah znate što radite, bez mučenja i bez priručnika.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-who">
          <p className="about__kicker">Tko stoji iza AnyMinutesa</p>
          <h2 id="about-who">Iza AnyMinutesa za sada stojim ja.</h2>
          <div className="about__prose">
            <p>
              Nema velikog tima ni investitora — samo ideja da mali poslovi
              zaslužuju alat koji im olakšava dan, a ne dodaje posla. To mi daje
              slobodu da slušam izravno vas i da proizvod vodim u smjeru koji vama
              ima smisla.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-why">
          <p className="about__kicker">Naša misija</p>
          <h2 id="about-why">Zašto radim ovo</h2>
          <div className="about__prose">
            <p>
              Vjerujem da mali poslovi — studiji, saloni, igraonice — nemaju vremena
              za složene programe. Vaše vrijeme pripada vašim klijentima, a ne
              administraciji.
            </p>
            <p>
              Zato gradim AnyMinutes: da bude jednostavan, pregledan i da radi upravo
              ono što vam treba. Cilj mi je da vam vratim vrijeme koje danas trošite
              na poruke, papire i dogovaranje.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-build">
          <p className="about__kicker">Kako gradim AnyMinutes</p>
          <h2 id="about-build">Slušam svoje prve korisnike</h2>
          <div className="about__prose">
            <p>
              AnyMinutes ne gradim po svojoj glavi, nego uz svoje prve korisnike.
              Razgovaram s njima, gledam kako stvarno rade i prilagođavam aplikaciju
              njihovim potrebama.
            </p>
            <p>
              Svaka nova mogućnost ulazi tek kad vidim da nekome olakšava stvaran
              posao. Tako aplikacija ostaje jednostavna i raste u smjeru koji ima
              smisla za ljude koji je koriste.
            </p>
            <p>
              Ako ste među prvima — vaše mišljenje ima pravu težinu. Ono izravno
              oblikuje ono što gradim sljedeće.
            </p>
          </div>
        </section>

        <section className="about__section" aria-labelledby="about-promise">
          <p className="about__kicker">Moje obećanje vama</p>
          <h2 id="about-promise">Što možete očekivati</h2>
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
          <p className="about__kicker">Završni poziv</p>
          <h2 id="about-close">Krenimo zajedno</h2>
          <div className="about__prose">
            <p>
              AnyMinutes je tek na početku i razvija se sa svakim poslom koji mu se
              pridruži. Ako imate ideju, pitanje ili prijedlog — javite mi se. Rado
              ću vas saslušati.
            </p>
          </div>
          <p className="about__contact">
            Pišite na
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
