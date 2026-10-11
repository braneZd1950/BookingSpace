import { Link } from 'react-router-dom';
import BusinessSignupForm from './BusinessSignupForm.jsx';
import './RegisterPage.scss';

export default function RegisterPage() {
  return (
    <main className="register register--wide">
      <h1>Otvorite poslovanje.</h1>
      <p className="register__lead">
        Za studije i poslovne subjekte. Iz naziva nastaje jedinstveni slug.
      </p>
      <BusinessSignupForm />
      <p className="register__login">
        Natrag na <Link to="/">početnu</Link>
      </p>
    </main>
  );
}
