import './UiThemePicker.scss';

const OPTIONS = [
  { value: 'system', label: 'Sustav', hint: 'Prati uređaj' },
  { value: 'light', label: 'Svijetla', hint: 'Uvijek svijetlo' },
  { value: 'dark', label: 'Tamna', hint: 'Uvijek tamno' },
];

export default function UiThemePicker({
  value = 'system',
  onChange,
  disabled = false,
}) {
  return (
    <fieldset className="ui-theme-picker" disabled={disabled}>
      <legend className="ui-theme-picker__legend">Tema sučelja</legend>
      <p className="ui-theme-picker__lead">
        Odaberite svijetlu ili tamnu temu — vrijedi za sve stranice studija i člana nakon prijave
        (početna, termini, privatnost…). Javni marketing (landing, prijava) ostaje uvijek svijetao.
      </p>
      <div className="ui-theme-picker__options" role="radiogroup" aria-label="Tema sučelja">
        {OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`ui-theme-picker__option${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onChange?.(option.value)}
            >
              <span className={`ui-theme-picker__swatch ui-theme-picker__swatch--${option.value}`} aria-hidden="true" />
              <span className="ui-theme-picker__copy">
                <strong>{option.label}</strong>
                <em>{option.hint}</em>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
