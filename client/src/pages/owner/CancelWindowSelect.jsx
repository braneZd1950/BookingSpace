import { useEffect, useId, useMemo, useRef } from 'react';
import { formatCancellationWindow } from './studioTime.js';
import './CancelWindowSelect.scss';

function hoursWord(hours) {
  if (hours === 1) return 'sat';
  if (hours >= 2 && hours <= 4) return 'sata';
  return 'sati';
}

function optionFor(minutes) {
  if (minutes < 60) {
    return {
      value: minutes,
      short: `${minutes} m`,
      label: `${minutes} minuta prije`,
    };
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return {
      value: minutes,
      short: `${hours} h`,
      label: `${hours} ${hoursWord(hours)} prije`,
    };
  }
  return {
    value: minutes,
    short: `${hours}h${rest}`,
    label: `${hours} ${hoursWord(hours)} i ${rest} min prije`,
  };
}

/** 30 min … 12 h, korak 30 min. */
export const CANCEL_WINDOW_OPTIONS = Array.from(
  { length: (12 * 60 - 30) / 30 + 1 },
  (_, index) => optionFor(30 + index * 30),
);

function shortFor(minutes) {
  const match = CANCEL_WINDOW_OPTIONS.find((item) => item.value === minutes);
  if (match) return match.short;
  return optionFor(minutes).short;
}

/** Visual fill 0–1 on a 12h scale (dial). */
function urgency(minutes) {
  const max = 12 * 60;
  return Math.min(1, Math.max(0.12, Math.sqrt(minutes / max)));
}

function optionIndex(options, minutes) {
  const exact = options.findIndex((item) => item.value === minutes);
  if (exact >= 0) return exact;
  let best = 0;
  let bestDiff = Infinity;
  options.forEach((item, index) => {
    const diff = Math.abs(item.value - minutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = index;
    }
  });
  return best;
}

/** Linear thumb position along the scrub track. */
function trackRatio(options, minutes) {
  if (options.length <= 1) return 0;
  return optionIndex(options, minutes) / (options.length - 1);
}

function valueFromClientX(line, options, clientX) {
  const rect = line.getBoundingClientRect();
  if (rect.width <= 0 || options.length === 0) return options[0]?.value;
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const index = Math.round(ratio * (options.length - 1));
  return options[index].value;
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
  const track = useRef(null);
  const trackLine = useRef(null);
  const dragging = useRef(false);
  const minutesRef = useRef(60);
  const listId = useId();
  const minutes = Number(value) || 60;
  minutesRef.current = minutes;
  const chosen = useMemo(
    () => options.find((item) => item.value === minutes) || null,
    [options, minutes],
  );
  const fill = urgency(minutes);
  const scrub = trackRatio(options, minutes);
  const minValue = options[0]?.value ?? 30;
  const maxValue = options[options.length - 1]?.value ?? 720;

  useEffect(() => {
    const node = track.current;
    if (!node) return undefined;

    function onWheel(event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.deltaY === 0 && event.deltaX === 0) return;
      const delta = (event.deltaY || event.deltaX) > 0 ? 1 : -1;
      const index = optionIndex(options, minutesRef.current);
      const next = options[Math.min(options.length - 1, Math.max(0, index + delta))];
      if (next && next.value !== minutesRef.current) onChange(next.value);
    }

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [options, onChange]);

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

  function commitFromPointer(clientX) {
    const line = trackLine.current;
    if (!line) return;
    const next = valueFromClientX(line, options, clientX);
    if (next != null && next !== minutes) onChange(next);
  }

  function stepBy(delta) {
    const index = optionIndex(options, minutes);
    const next = options[Math.min(options.length - 1, Math.max(0, index + delta))];
    if (next && next.value !== minutes) onChange(next.value);
  }

  function onTrackPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    dragging.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    commitFromPointer(event.clientX);
  }

  function onTrackPointerMove(event) {
    if (!dragging.current) return;
    event.preventDefault();
    commitFromPointer(event.clientX);
  }

  function onTrackPointerUp(event) {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* already released */
    }
  }

  function onTrackKeyDown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      stepBy(1);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      stepBy(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange(minValue);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onChange(maxValue);
    }
  }

  return (
    <div className={open ? 'cancel-window is-open' : 'cancel-window'} ref={root}>
      <span className="cancel-window__label" id={`${listId}-label`}>
        {label}
      </span>

      <div className="cancel-window__shell">
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
          <span className="cancel-window__chev" aria-hidden="true" />
        </button>

        <div
          className="cancel-window__track"
          ref={track}
          role="slider"
          tabIndex={0}
          aria-labelledby={`${listId}-label`}
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          aria-valuenow={minutes}
          aria-valuetext={chosen?.label || formatCancellationWindow(minutes)}
          aria-orientation="horizontal"
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
          onKeyDown={onTrackKeyDown}
        >
          <span className="cancel-window__track-line" ref={trackLine}>
            <i style={{ left: `${scrub * 100}%` }} />
          </span>
          <span className="cancel-window__track-ends" aria-hidden="true">
            <em>30 m</em>
            <em>povuci ili scroll</em>
            <em>12 h</em>
          </span>
        </div>
      </div>

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
