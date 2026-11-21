import { UI_THEME_OPTIONS } from '../../../shared/memberAccountSettings.js';
import './UiThemePicker.scss';

const OPTIONS = UI_THEME_OPTIONS;

export default function UiThemePicker({
  value = 'system',
  onChange,
  disabled = false,
}) {
  return (
    <fieldset className="ui-theme-picker" disabled={disabled}>
      <legend className="ui-theme-picker__legend">Tema sučelja</legend>
      <p className="ui-theme-picker__lead">
        Odaberite kako želite da aplikacija izgleda. Odabir se sprema odmah.
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
