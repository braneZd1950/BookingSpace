import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDiscoverTenantsQuery } from '../../api/tenantApi.js';
import {
  allowsOnlineBookingFromDiscover,
  DISCOVER_VISIBILITY,
  isDiscoverExcludedTenant,
  isListedOnDiscover,
} from '../../lib/discoverVisibility.js';
import {
  discoverCategories,
  placesForCategory,
  toPublicDiscoverCategory,
} from '../../mock/discoverPlaces.js';
import '../member/MemberDiscoverPage.scss';

function normalizePlace(place) {
  const slug = String(place.slug || '').trim();
  if (!slug || !place.live) return null;
  if (isDiscoverExcludedTenant({ slug, name: place.name })) return null;

  // Until the API always sends discoverVisibility, treat missing as private.
  const visibility = place.discoverVisibility || DISCOVER_VISIBILITY.PRIVATE;
  if (!isListedOnDiscover(visibility)) return null;

  const categoryId = toPublicDiscoverCategory(place.categoryId || place.niche);
  if (!categoryId) return null;

  return {
    ...place,
    categoryId,
    name: place.name,
    city: place.city || '',
    area: place.area || '',
    note: place.note || '',
    tags: place.tags || [],
    slug,
    live: true,
    discoverVisibility: visibility,
    onlineBooking: allowsOnlineBookingFromDiscover(visibility),
  };
}

function countsFromPlaces(places) {
  const counts = { all: places.length };
  for (const category of discoverCategories) counts[category.id] = 0;
  for (const place of places) {
    const key = place.categoryId || 'generic';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('all');
  const deferredQuery = useDeferredValue(query.trim());

  const {
    data: discoverData,
    isLoading,
    isError,
    isFetching,
  } = useDiscoverTenantsQuery({
    q: deferredQuery,
    category: 'all',
    limit: 100,
  });

  const allPlaces = useMemo(() => {
    const livePlaces = discoverData?.places || [];
    return livePlaces
      .map((place) => normalizePlace({
        ...place,
        categoryId: place.categoryId || place.niche,
        live: true,
        discoverVisibility: place.discoverVisibility || DISCOVER_VISIBILITY.PUBLIC,
      }))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, 'hr'));
  }, [discoverData]);

  const nicheCounts = useMemo(() => countsFromPlaces(allPlaces), [allPlaces]);

  const filteredPlaces = useMemo(
    () => (nicheFilter === 'all'
      ? allPlaces
      : allPlaces.filter((place) => place.categoryId === nicheFilter)),
    [allPlaces, nicheFilter],
  );

  const shownSections = useMemo(
    () => discoverCategories
      .filter((category) => nicheFilter === 'all' || category.id === nicheFilter)
      .map((category) => ({
        ...category,
        places: placesForCategory(category.id, filteredPlaces),
      }))
      .filter((category) => category.places.length > 0),
    [filteredPlaces, nicheFilter],
  );

  const searching = isLoading || (isFetching && !discoverData);

  return (
    <main className="member-discover">
      <div className="member-discover__atmosphere" aria-hidden="true">
        <span className="member-discover__wash" />
        <span className="member-discover__grain" />
      </div>

      <div className="member-discover__stage">
        <header className="member-discover__head">
          <div>
            <p className="member-discover__eyebrow">Otkrij</p>
            <h1>Pronađite uslugu ili mjesto koje tražite.</h1>
            <p className="member-discover__lede">
              Istražite igraonice, wellness, beauty, aktivnosti i druge usluge.
              Pronađite poslovanje koje vam odgovara, pregledajte njegovu ponudu
              i rezervirajte izravno putem njegove stranice.
            </p>
          </div>
        </header>

        <form
          className="member-discover__search"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span className="visually-hidden">Pretraživanje</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pronađite poslovanje, uslugu, aktivnost ili grad."
              autoComplete="off"
            />
          </label>
          {searching ? (
            <p className="member-discover__search-note">Tražimo dostupna mjesta…</p>
          ) : null}
          {!searching && isError ? (
            <p className="member-discover__search-note">
              Trenutačno ne možemo učitati popis. Pokušajte ponovno uskoro.
            </p>
          ) : null}
        </form>

        <div
          className="member-discover__niches-nav"
          role="tablist"
          aria-label="Kategorije"
        >
          <button
            type="button"
            role="tab"
            aria-selected={nicheFilter === 'all'}
            className={nicheFilter === 'all' ? 'is-on' : undefined}
            onClick={() => setNicheFilter('all')}
          >
            Sve
            {nicheCounts.all > 0 ? <span>{nicheCounts.all}</span> : null}
          </button>
          {discoverCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={nicheFilter === category.id}
              className={nicheFilter === category.id ? 'is-on' : undefined}
              onClick={() => setNicheFilter(category.id)}
            >
              {category.name}
              {nicheCounts[category.id] > 0 ? (
                <span>{nicheCounts[category.id]}</span>
              ) : null}
            </button>
          ))}
        </div>

        {shownSections.length === 0 ? (
          <section className="member-discover__block">
            <p className="member-discover__empty">
              {deferredQuery
                ? `Nema rezultata za „${deferredQuery}”. Pokušajte drugi pojam.`
                : 'Još nema javno vidljivih poslovanja. Vlasnici koji žele nove klijente mogu uključiti prikaz u Otkrij.'}
            </p>
          </section>
        ) : (
          shownSections.map((category, offset) => (
            <section key={category.id} className="member-discover__block">
              <header className="member-discover__panel-head">
                <span className="member-discover__index" aria-hidden="true">
                  {String(offset + 1).padStart(2, '0')}
                </span>
                <div>
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
                  <li key={place.id || place.slug}>
                    <div>
                      <div className="member-discover__place-title">
                        <strong>{place.name}</strong>
                      </div>
                      <p className="member-discover__place-meta">
                        {[place.city, place.area].filter(Boolean).join(' · ') || 'Hrvatska'}
                      </p>
                      {place.note ? (
                        <p className="member-discover__place-note">{place.note}</p>
                      ) : null}
                      {place.tags?.length ? (
                        <p className="member-discover__tags">
                          {place.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                    <Link to={`/s/${place.slug}`}>
                      {place.onlineBooking ? 'Otvori' : 'Pogledaj'}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <section className="member-discover__block">
          <header className="member-discover__panel-head">
            <span className="member-discover__index" aria-hidden="true">01</span>
            <div>
              <h2>Istražite ponudu</h2>
              <p>
                Pregledajte dostupna poslovanja, njihove usluge i informacije.
                Kada pronađete ono što tražite, posjetite njihovu stranicu i
                provjerite mogućnosti rezervacije.
              </p>
            </div>
          </header>
        </section>

        <section className="member-discover__block member-discover__block--note">
          <header className="member-discover__panel-head">
            <span className="member-discover__index" aria-hidden="true">02</span>
            <div>
              <h2>Rezervirajte izravno kod odabranog poslovanja.</h2>
              <p>
                Svako poslovanje ima svoju stranicu i samostalno upravlja svojom
                ponudom i rezervacijama. Blizari vam omogućuje da jednostavnije
                pronađete ono što tražite i povežete se izravno s pružateljem
                usluge.
              </p>
              <p className="member-discover__place-note">
                Vaše mjesto za otkrivanje novih mogućnosti.
              </p>
              <p className="member-discover__place-note">
                Želite predstaviti svoje poslovanje?
              </p>
            </div>
          </header>
          <div className="member-discover__actions">
            <Link className="member-discover__ghost" to="/mogucnosti">
              Mogućnosti Blizaria
            </Link>
            <Link className="member-discover__primary" to="/register">
              Napravite svoju Blizari stranicu
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
