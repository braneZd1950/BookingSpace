import { useEffect, useId, useMemo, useRef } from 'react';
import { formatCancellationWindow } from './studioTime.js';
import './CancelWindowSelect.scss';

export const CANCEL_WINDOW_OPTIONS = [
  { value: 15, short: '15 m', label: '15 minuta prije' },
  { value: 30, short: '30 m', label: '30 minuta prije' },
  { value: 60, short: '1 h', label: '1 sat prije' },
  { value: 120, short: '2 h', label: '2 sata prije' },
  { value: 180, short: '3 h', label: '3 sata prije' },
  { value: 360, short: '6 h', label: '6 sati prije' },
  { value: 720, short: '12 h', label: '12 sati prije' },
  { value: 1440, short: '24 h', label: '24 sata prije' },
];

function shortFor(minutes) {
  const match = CANCEL_WINDOW_OPTIONS.find((item) => item.value === minutes);
  if (match) return match.short;
  if (minutes < 60) return `${minutes} m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} h` : `${minutes} m`;
}

/** Visual fill 0–1 for how “late” the window sits on a 24h scale. */
function urgency(minutes) {
  const max = 1440;
  return Math.min(1, Math.max(0.12, Math.sqrt(minutes / max)));
}

export default function CancelWindowSelect({
  label = 'Najkasniji otkaz',
  value,
  options = CANCEL_WINDOW_OPTIONS,
  open,
  onOpen,
  onClose,
  onChange,
}) {
  const root = useRef(null);
  const listId = useId();
  const minutes = Number(value) || 60;
  const chosen = useMemo(
    () => options.find((item) => item.value === minutes) || null,
    [options, minutes],
  );
  const fill = urgency(minutes);

  useEffect(() => {
    if (!open) return undefined;
    function away(event) {
      if (!root.current?.contains(event.target)) onClose();
    }
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', onKey);
    const selected = root.current?.querySelector('[aria-selected="true"]');
    const list = root.current?.querySelector('.cancel-window__list');
    if (selected && list) {
      list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
    }
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={open ? 'cancel-window is-open' : 'cancel-window'} ref={root}>
      <span className="cancel-window__label" id={`${listId}-label`}>
        {label}
      </span>

      <button
        type="button"
        className="cancel-window__face"
        aria-labelledby={`${listId}-label`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        <span className="cancel-window__dial" aria-hidden="true" style={{ '--fill': fill }}>
          <span className="cancel-window__dial-ring" />
          <strong>{shortFor(minutes)}</strong>
        </span>
        <span className="cancel-window__copy">
          <strong>{chosen?.label || formatCancellationWindow(minutes)}</strong>
          <em>Članovi vide na Termini</em>
        </span>
        <span className="cancel-window__track" aria-hidden="true">
          <span className="cancel-window__track-line">
            <i style={{ left: `${fill * 100}%` }} />
          </span>
          <span className="cancel-window__track-ends">
            <em>sada</em>
            <em>početak</em>
          </span>
        </span>
        <span className="cancel-window__chev" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="cancel-window__panel"
          role="listbox"
          id={listId}
          aria-labelledby={`${listId}-label`}
        >
          <p className="cancel-window__panel-hint">
            Rok do kojeg član može otkazati bez gubitka termina
          </p>
          <div className="cancel-window__list">
            {options.map((item) => {
              const on = item.value === minutes;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={on ? 'is-on' : undefined}
                  onClick={() => {
                    onChange(item.value);
                    onClose();
                  }}
                >
                  <span
                    className="cancel-window__chip"
                    aria-hidden="true"
                    style={{ '--fill': urgency(item.value) }}
                  >
                    {item.short}
                  </span>
                  <span className="cancel-window__copy">
                    <strong>{item.label}</strong>
                    <span>{formatCancellationWindow(item.value)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
