import { useEffect, useId, useMemo, useRef } from 'react';
import './MemberSelect.scss';

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function MemberSelect({
  label = 'Član',
  value,
  options,
  open,
  onOpen,
  onClose,
  onChange,
  placeholder = 'Odaberite člana',
}) {
  const root = useRef(null);
  const listId = useId();
  const chosen = useMemo(
    () => options.find((item) => item.value === value) || null,
    [options, value],
  );

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
    const list = root.current?.querySelector('.member-select__list');
    if (selected && list) {
      list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
    }
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={open ? 'member-select is-open' : 'member-select'} ref={root}>
      <span className="member-select__label" id={`${listId}-label`}>
        {label}
      </span>
      <button
        type="button"
        className={`member-select__face${chosen ? '' : ' is-empty'}`}
        aria-labelledby={`${listId}-label`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {chosen ? (
          <>
            <span className="member-select__avatar" aria-hidden="true">
              {initials(chosen.label)}
            </span>
            <span className="member-select__copy">
              <strong>{chosen.label}</strong>
              {chosen.note ? <em>{chosen.note}</em> : null}
            </span>
          </>
        ) : (
          <>
            <span className="member-select__avatar member-select__avatar--empty" aria-hidden="true" />
            <span className="member-select__copy">
              <strong>{placeholder}</strong>
              <em>Aktivni članovi studija</em>
            </span>
          </>
        )}
        <span className="member-select__chev" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="member-select__panel"
          role="listbox"
          id={listId}
          aria-labelledby={`${listId}-label`}
        >
          <div className="member-select__list">
            {options.map((item) => {
              const on = item.value === value;
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
                  <span className="member-select__avatar" aria-hidden="true">
                    {initials(item.label)}
                  </span>
                  <span className="member-select__copy">
                    <strong>{item.label}</strong>
                    {item.hint ? <span>{item.hint}</span> : null}
                  </span>
                  {item.note ? (
                    <span className="member-select__badge">{item.note}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
