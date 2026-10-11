import { useEffect, useRef } from 'react';

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const baseMinutes = ['00', '15', '30', '45'];

export default function TimeSelect({ label, value, open, onOpen, onClose, onChange }) {
  const root = useRef(null);
  const [hour = '09', minute = '00'] = (value || '09:00').split(':');
  const minutes = baseMinutes.includes(minute) ? baseMinutes : [...baseMinutes, minute].sort();

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
    root.current?.querySelectorAll('.is-on').forEach((node) => {
      const list = node.parentElement;
      list.scrollTop = node.offsetTop - list.clientHeight / 2 + node.clientHeight / 2;
    });
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  function pickHour(next) {
    onChange(`${next}:${minute}`);
  }

  function pickMinute(next) {
    onChange(`${hour}:${next}`);
    onClose();
  }

  return (
    <div className={open ? 'time is-open' : 'time'} ref={root}>
      <button
        type="button"
        className="time__face"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? onClose() : onOpen())}
      >
        {hour}:{minute}
      </button>
      {open ? (
        <div className="time__panel" role="listbox" aria-label={label}>
          <div className="time__col">
            <span>Sat</span>
            <div className="time__list">
              {hours.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === hour ? 'is-on' : undefined}
                  onClick={() => pickHour(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="time__col">
            <span>Min</span>
            <div className="time__list">
              {minutes.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === minute ? 'is-on' : undefined}
                  onClick={() => pickMinute(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
