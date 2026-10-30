import { Link } from 'react-router-dom';
import BusinessSignupForm from './BusinessSignupForm.jsx';
import './RegisterPage.scss';

export default function RegisterPage() {
  return (
    <main className="register">
      <div className="register__atmosphere" aria-hidden="true">
        <span className="register__orb register__orb--a" />
        <span className="register__orb register__orb--b" />
        <span className="register__grain" />
        <span className="register__watermark">anyminutes</span>
      </div>

      <div className="register__shell">
        <header className="register__intro">
          <p className="register__brand">anyminutes</p>
          <h1>Pokrenite svoj prostor.</h1>
          <p className="register__lead">
            Za studije, igraonice, salone i ostala poslovanja koja rade po terminima.
            Odaberite naziv i dobit ćete vlastitu poveznicu za rezervacije —
            podijelite je klijentima, oni rezerviraju sami.
          </p>
        </header>

        <BusinessSignupForm className="register__desk" />

        <p className="register__login">
          Natrag na <Link to="/">početnu</Link>
        </p>
      </div>
    </main>
  );
}
