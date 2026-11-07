import { useState } from 'react';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5zm0 12.5A5 5 0 1 1 12 7.5a5 5 0 0 1 0 10zm0-2.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3.3 2.2 2.2 3.3l3.1 3.1C3.5 7.6 1.9 9.4 1 12.5 2.7 16.9 7 20 12 20c2 0 3.9-.5 5.5-1.3l3.2 3.2 1.1-1.1L3.3 2.2zM12 18.5c-4.1 0-7.6-2.5-9.1-6 1-2.2 2.6-3.8 4.5-4.7l1.7 1.7A5 5 0 0 0 12 17a4.9 4.9 0 0 0 2.5-.7l1.5 1.5c-1.2.5-2.6.7-4 .7zm9.9-6C20.4 8.6 17.5 6.3 14 5.5l1.7 1.7c1.6.8 3 2.1 3.9 3.8-.5 1.2-1.3 2.3-2.3 3.1l1.2 1.2c1.4-1.1 2.5-2.6 3.4-4.3zM9.2 8.1l1.6 1.6A2.8 2.8 0 0 1 14.3 13l1.5 1.5a5 5 0 0 0-6.6-6.4z"
      />
    </svg>
  );
}

/**
 * Shared password input with show/hide toggle.
 * Pass className / wrapClassName / buttonClassName to match page CSS.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'new-password',
  className,
  wrapClassName,
  buttonClassName,
  id,
  name,
  required,
  minLength,
  placeholder,
  invalid,
  error,
  textToggle = false,
}) {
  const [visible, setVisible] = useState(false);
  const tip = visible ? 'Sakrij lozinku' : 'Prikaži lozinku';

  const control = (
    <span className={wrapClassName || undefined}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className={buttonClassName || undefined}
        onClick={() => setVisible((current) => !current)}
        title={tip}
        aria-label={tip}
      >
        {textToggle ? (visible ? 'Sakrij' : 'Prikaži') : (visible ? <EyeOffIcon /> : <EyeIcon />)}
      </button>
    </span>
  );

  if (!label) return control;

  return (
    <label className={className || undefined}>
      {label}
      {control}
      {error ? <span className="biz-form__error">{error}</span> : null}
    </label>
  );
}

export { EyeIcon, EyeOffIcon };
