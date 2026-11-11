import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../api/authApi.js';
import PasswordField from '../../components/PasswordField.jsx';
import { isEmail } from '../../lib/isEmail.js';
import './BusinessSignupForm.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

function localProblems(values) {
  const problems = {};
  if (!values.name.trim()) problems.name = 'Upišite ime.';
  if (!isEmail(values.email.trim())) problems.email = 'Upišite ispravnu e-poštu.';
  if (values.password.length < 8) {
    problems.password = 'Lozinka mora imati najmanje 8 znakova.';
  }
  if (!values.passwordAgain) {
    problems.passwordAgain = 'Potvrdite lozinku.';
  } else if (values.password !== values.passwordAgain) {
    problems.passwordAgain = 'Lozinke se ne podudaraju.';
  }
  if (!values.acceptTerms) {
    problems.acceptTerms = 'Prihvatite privatnost i uvjete korištenja.';
  }
  return problems;
}

/**
 * Registracija civilnog korisnika (CUSTOMER) — nije partner.
 */
export default function ClientSignupForm({ className = '' }) {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    passwordAgain: '',
    acceptTerms: false,
  });
  const [problems, setProblems] = useState({});
  const [formError, setFormError] = useState('');

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setProblems((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextProblems = localProblems(values);
    setProblems(nextProblems);
    setFormError('');
    if (Object.keys(nextProblems).length) return;

    try {
      const result = await register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: 'CUSTOMER',
      }).unwrap();

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          detail: 'Račun korisnika je otvoren.',
        }),
      );
      navigate('/login', { replace: true });
    } catch (error) {
      if (error?.status === 'FETCH_ERROR') {
        setFormError('Poslužitelj nije dostupan. Pokušajte ponovno za trenutak.');
        return;
      }
      if (error?.data?.code === 'EMAIL_TAKEN') {
        setFormError('Ova e-pošta je već registrirana.');
        return;
      }
      setFormError(error?.data?.message || 'Registracija nije uspjela. Pokušajte ponovno.');
    }
  }

  return (
    <form className={`biz-form ${className}`.trim()} onSubmit={onSubmit} noValidate>
      <label>
        Ime
        <input
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          aria-invalid={Boolean(problems.name)}
        />
        {problems.name ? <span className="biz-form__error">{problems.name}</span> : null}
      </label>

      <label>
        E-pošta
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          aria-invalid={Boolean(problems.email)}
        />
        {problems.email ? <span className="biz-form__error">{problems.email}</span> : null}
      </label>

      <PasswordField
        label="Lozinka"
        className="biz-form__password"
        wrapClassName="biz-form__password-wrap"
        buttonClassName="biz-form__eye"
        name="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => update('password', event.target.value)}
        invalid={Boolean(problems.password)}
      />
      {problems.password ? <span className="biz-form__error">{problems.password}</span> : null}

      <PasswordField
        label="Ponovite lozinku"
        className="biz-form__password"
        wrapClassName="biz-form__password-wrap"
        buttonClassName="biz-form__eye"
        name="passwordAgain"
        autoComplete="new-password"
        value={values.passwordAgain}
        onChange={(event) => update('passwordAgain', event.target.value)}
        invalid={Boolean(problems.passwordAgain)}
      />
      {problems.passwordAgain ? (
        <span className="biz-form__error">{problems.passwordAgain}</span>
      ) : null}

      <label className="biz-form__consent">
        <span className="biz-form__switch">
          <input
            type="checkbox"
            checked={values.acceptTerms}
            onChange={(event) => update('acceptTerms', event.target.checked)}
            aria-invalid={Boolean(problems.acceptTerms)}
          />
          <span aria-hidden="true" />
        </span>
        <span>
          Prihvaćam{' '}
          <Link to="/privatnost" target="_blank" rel="noreferrer">
            pravila privatnosti
          </Link>{' '}
          i{' '}
          <Link to="/uvjeti" target="_blank" rel="noreferrer">
            uvjete korištenja
          </Link>
          .
        </span>
      </label>
      {problems.acceptTerms ? (
        <span className="biz-form__error">{problems.acceptTerms}</span>
      ) : null}

      {formError ? <p className="biz-form__form-error">{formError}</p> : null}

      <button className="biz-form__submit" type="submit" disabled={isLoading}>
        {isLoading ? 'Otvaramo račun…' : 'Registrirajte se'}
      </button>
    </form>
  );
}
