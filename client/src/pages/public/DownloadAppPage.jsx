import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ANDROID_APP_DOWNLOAD_URL,
  isExternalAppDownload,
  probeAndroidDownload,
} from '../../lib/appDownload.js';
import './DownloadAppPage.scss';

export default function DownloadAppPage() {
  const href = ANDROID_APP_DOWNLOAD_URL;
  const external = isExternalAppDownload(href);
  const [available, setAvailable] = useState(null);

  const checkAvailability = useCallback(async () => {
    setAvailable(null);
    const ok = await probeAndroidDownload(href);
    setAvailable(ok);
  }, [href]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await probeAndroidDownload(href);
      if (!cancelled) setAvailable(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [href]);

  return (
    <main className="download-app">
      <div className="download-app__atmosphere" aria-hidden="true">
        <span className="download-app__wash" />
        <span className="download-app__grain" />
      </div>

      <section className="download-app__stage" aria-labelledby="download-app-title">
        <p className="download-app__brand">anyminutes</p>
        <h1 id="download-app-title">Preuzmite aplikaciju</h1>
        <p className="download-app__lead">
          Instalirajte anyminutes izravno s naše stranice. Trenutno je dostupna
          Android verzija — preuzimanjem datoteke ovdje, bez Google Play trgovine.
        </p>

        {available === null ? (
          <p className="download-app__status" role="status">
            Provjeravamo dostupnost…
          </p>
        ) : null}

        {available === true ? (
          <div className="download-app__offer">
            <a
              className="download-app__cta"
              href={href}
              download={external ? undefined : 'anyminutes.apk'}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              Preuzmi za Android
            </a>
            <p className="download-app__trust">
              Isti račun kao na webu. Prijavite se i nastavite točno tamo gdje ste stali.
            </p>
            <Link className="download-app__back" to="/">
              Natrag na početnu
            </Link>
          </div>
        ) : null}

        {available === false ? (
          <div className="download-app__unavailable" role="status">
            <h2 className="download-app__unavailable-title">
              Trenutačno ne možemo poslužiti datoteku
            </h2>
            <p>
              Aplikacija još nije dostupna za preuzimanje. Pokušajte ponovno za
              koji trenutak ili nam se javite i javit ćemo vam čim bude spremna.
            </p>
            <div className="download-app__unavailable-actions">
              <button
                type="button"
                className="download-app__cta"
                onClick={() => void checkAvailability()}
              >
                Pokušaj ponovno
              </button>
              <Link className="download-app__back" to="/">
                Natrag na početnu
              </Link>
            </div>
          </div>
        ) : null}

        {available === true ? (
          <>
            <div className="download-app__howto">
              <h2 className="download-app__howto-title">Kako instalirati u tri koraka</h2>
              <ol className="download-app__steps">
                <li>
                  <span className="download-app__step-num" aria-hidden="true">01</span>
                  <span>Preuzmite datoteku na svoj Android telefon.</span>
                </li>
                <li>
                  <span className="download-app__step-num" aria-hidden="true">02</span>
                  <span>
                    Otvorite preuzetu datoteku. Ako vas telefon pita, dopustite
                    instalaciju iz nepoznatog izvora.
                  </span>
                </li>
                <li>
                  <span className="download-app__step-num" aria-hidden="true">03</span>
                  <span>
                    Pokrenite anyminutes i prijavite se istim računom koji koristite
                    na webu.
                  </span>
                </li>
              </ol>
            </div>

            <aside className="download-app__aside" aria-labelledby="download-unknown-source">
              <h2 id="download-unknown-source">Zašto „iz nepoznatog izvora”?</h2>
              <p>
                Android telefoni po defaultu dopuštaju instalaciju samo iz Google
                Play trgovine. Budući da anyminutes preuzimate izravno s naše
                stranice, telefon će vas jednom pitati dopuštenje. To je uobičajeno
                i sigurno — samo potvrdite i instalacija se nastavlja.
              </p>
            </aside>

            <p className="download-app__ios">
              iPhone verzija uskoro.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
