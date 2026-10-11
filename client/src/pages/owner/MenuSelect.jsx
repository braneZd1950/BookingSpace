import { useEffect, useRef } from 'react';
import './MenuSelect.scss';

export default function MenuSelect({
  label,
  value,
  options,
  open,
  onOpen,
  onClose,
  onChange,
}) {
  const root = useRef(null);
  const chosen = options.find((item) => item.value === value) || options[0];

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
    const selected = root.current?.querySelector('.is-on');
    const list = root.current?.querySelector('.menu-select__list');
    if (selected && list) {
      list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
    }
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={open ? 'menu-select is-open' : 'menu-select'} ref={root}>
      <span className="menu-select__label">{label}</span>
      <button
        type="button"
        className="menu-select__face"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? onClose() : onOpen())}
      >
        <span>{chosen?.label || 'Odaberite'}</span>
        <span className="menu-select__chev" aria-hidden="true" />
      </button>
      {open ? (
        <div className="menu-select__panel" role="listbox" aria-label={label}>
          <div className="menu-select__list">
            {options.map((item) => (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={item.value === value}
                className={item.value === value ? 'is-on' : undefined}
                onClick={() => {
                  onChange(item.value);
                  onClose();
                }}
              >
                <strong>{item.label}</strong>
                {item.note ? <span>{item.note}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
