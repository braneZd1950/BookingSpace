export function PrefToggleList({ options, prefs, onToggle }) {
  return (
    <ul className="settings__toggles">
      {options.map(([key, title, noteText]) => (
        <li key={key}>
          <div>
            <strong>{title}</strong>
            <span>{noteText}</span>
          </div>
          <label className="settings__switch" aria-label={title}>
            <input
              type="checkbox"
              checked={Boolean(prefs[key])}
              onChange={(event) => onToggle(key, event.target.checked)}
            />
            <span aria-hidden="true" />
          </label>
        </li>
      ))}
    </ul>
  );
}

export function NotifyChannelHeader({ index, title, lead, count }) {
  return (
    <header className="settings__notify-head">
      <span className="settings__notify-index" aria-hidden="true">{index}</span>
      <div>
        <p className="settings__notify-kicker">Kanal</p>
        <h2>{title}</h2>
        <p className="settings__lead">{lead}</p>
      </div>
      <p className="settings__notify-meta">
        <strong>{count}</strong>
        <span>uključeno</span>
      </p>
    </header>
  );
}

export function AddressCityFields({ address, city, onAddress, onCity }) {
  return (
    <>
      <label className="settings__full">
        Ulica
        <input
          value={address}
          onChange={onAddress}
          placeholder="Ulica i kućni broj"
          autoComplete="street-address"
        />
      </label>
      <label>
        Grad
        <input
          value={city}
          onChange={onCity}
          placeholder="npr. Zagreb"
          autoComplete="address-level2"
        />
      </label>
    </>
  );
}
