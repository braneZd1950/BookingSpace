import { Link } from 'react-router-dom';
import { discoverCategories } from '../../lib/discoverCategories.js';

export function DiscoverAtmosphere() {
  return (
    <div className="member-discover__atmosphere" aria-hidden="true">
      <span className="member-discover__wash" />
      <span className="member-discover__grain" />
    </div>
  );
}

export function DiscoverSearchForm({
  query,
  onQueryChange,
  placeholder,
  label,
  status,
}) {
  return (
    <form
      className="member-discover__search"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        <span className="visually-hidden">{label}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </label>
      {status || null}
    </form>
  );
}

export function DiscoverCategoryTabs({
  nicheFilter,
  onFilterChange,
  nicheCounts,
  ariaLabel = 'Kategorije',
  alwaysShowCount = false,
}) {
  return (
    <div
      className="member-discover__niches-nav"
      role="tablist"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="tab"
        aria-selected={nicheFilter === 'all'}
        className={nicheFilter === 'all' ? 'is-on' : undefined}
        onClick={() => onFilterChange('all')}
      >
        Sve
        {alwaysShowCount || nicheCounts.all > 0 ? (
          <span>{nicheCounts.all || 0}</span>
        ) : null}
      </button>
      {discoverCategories.map((category) => {
        const count = nicheCounts[category.id] || 0;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={nicheFilter === category.id}
            className={nicheFilter === category.id ? 'is-on' : undefined}
            onClick={() => onFilterChange(category.id)}
          >
            {category.name}
            {alwaysShowCount || count > 0 ? <span>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function DiscoverEmptyState({ deferredQuery, fallback }) {
  return (
    <section className="member-discover__block">
      <p className="member-discover__empty">
        {deferredQuery
          ? `Nema rezultata za „${deferredQuery}”. Pokušajte drugi pojam.`
          : fallback}
      </p>
    </section>
  );
}

function PlaceTags({ tags }) {
  if (!tags?.length) return null;
  return (
    <p className="member-discover__tags">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </p>
  );
}

export function DiscoverPlaceSections({
  sections,
  isRelatedCategory,
  renderAction,
  showKicker = false,
  alwaysShowNote = false,
}) {
  return sections.map((category, offset) => (
    <section key={category.id} className="member-discover__block">
      <header className="member-discover__panel-head">
        <span className="member-discover__index" aria-hidden="true">
          {String(offset + 1).padStart(2, '0')}
        </span>
        <div>
          {showKicker ? <p className="member-discover__kicker">Kategorija</p> : null}
          <h2>{category.name}</h2>
          <p>{category.note}</p>
        </div>
        <p className="member-discover__count">
          <strong>{category.places.length}</strong>
          <span>
            {category.places.length === 1 ? 'mjesto' : 'mjesta'}
          </span>
        </p>
      </header>
      <ul className="member-discover__places">
        {category.places.map((place) => (
          <li
            key={place.id || place.slug}
            className={
              isRelatedCategory?.(category.id) ? 'is-related' : undefined
            }
          >
            <div>
              <div className="member-discover__place-title">
                <strong>{place.name}</strong>
                {place.live === false ? <em>Primjer</em> : null}
              </div>
              <p className="member-discover__place-meta">
                {[place.city, place.area].filter(Boolean).join(' · ') || 'Hrvatska'}
              </p>
              {alwaysShowNote || place.note ? (
                <p className="member-discover__place-note">{place.note}</p>
              ) : null}
              <PlaceTags tags={place.tags} />
            </div>
            {renderAction ? renderAction(place) : (
              <Link to={`/s/${place.slug}`}>
                {place.onlineBooking ? 'Otvori' : 'Pogledaj'}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  ));
}
