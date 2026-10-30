import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useListMyMembershipsQuery } from '../../api/membershipApi.js';
import { useDiscoverTenantsQuery } from '../../api/tenantApi.js';
import {
  DISCOVER_MOCK_ENABLED,
  discoverCategories,
  discoverPlaces,
  filterDiscoverPlaces,
  placesForCategory,
} from '../../mock/discoverPlaces.js';
import { signupNiches } from '../owner/siteTemplates.js';
import './MemberDiscoverPage.scss';

function studioLabel(item) {
  return item.tenant?.name || item.tenantName || 'Studio';
}

function studioSlug(item) {
  return item.tenant?.slug || item.tenantSlug || '';
}

function categoryHere(categoryId, currentNiche) {
  if (categoryId === currentNiche) return true;
  if (categoryId === 'fitness') {
    return ['fitness', 'pilates', 'yoga', 'powerplate'].includes(currentNiche);
  }
  return false;
}

function mergePlaces(livePlaces, mockPlaces) {
  const bySlug = new Map();
  for (const place of mockPlaces) {
    if (place.slug) bySlug.set(place.slug, place);
    else bySlug.set(`mock:${place.id}`, place);
  }
  for (const place of livePlaces) {
    bySlug.set(place.slug || `live:${place.id}`, place);
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'hr'));
}

function countsFromPlaces(places) {
  const counts = {
    all: places.length,
    fitness: 0,
    services: 0,
    playroom: 0,
    generic: 0,
  };
  for (const place of places) {
    const key = place.categoryId || 'generic';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export default function MemberDiscoverPage() {
  const { slug } = useParams();
  const outlet = useOutletContext() || {};
  const tenant = outlet.tenant;
  const loggedIn = Boolean(
    outlet.loggedIn ?? localStorage.getItem('bookingspace.token'),
  );
  const [query, setQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('all');
  const deferredQuery = useDeferredValue(query.trim());

  const { data: membershipData } = useListMyMembershipsQuery(50, { skip: !loggedIn });
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

  const currentNiche = tenant?.niche || '';
  const nicheMeta = signupNiches.find((item) => item.id === currentNiche);

  const otherStudios = (membershipData?.memberships || [])
    .filter((item) => item.status === 'ACTIVE')
    .map((item) => ({
      id: item.id,
      name: studioLabel(item),
      slug: studioSlug(item),
      niche: item.tenant?.niche || '',
    }))
    .filter((item) => item.slug && item.slug !== slug);

  const livePlaces = discoverData?.places || [];

  const allPlaces = useMemo(() => {
    const mock = DISCOVER_MOCK_ENABLED
      ? filterDiscoverPlaces(discoverPlaces, deferredQuery)
      : [];
    return mergePlaces(livePlaces, mock);
  }, [livePlaces, deferredQuery]);

  const nicheCounts = useMemo(
    () => discoverData?.counts && livePlaces.length > 0 && !DISCOVER_MOCK_ENABLED
      ? {
        all: discoverData.counts.all || 0,
        fitness: discoverData.counts.fitness || 0,
        services: discoverData.counts.services || 0,
        playroom: discoverData.counts.playroom || 0,
        generic: discoverData.counts.generic || 0,
      }
      : countsFromPlaces(allPlaces),
    [discoverData, livePlaces.length, allPlaces],
  );

  const filteredPlaces = useMemo(
    () => (nicheFilter === 'all'
      ? allPlaces
      : allPlaces.filter((place) => place.categoryId === nicheFilter)),
    [allPlaces, nicheFilter],
  );

  const visibleSections = useMemo(
    () => discoverCategories
      .filter((category) => nicheFilter === 'all' || category.id === nicheFilter)
      .map((category) => ({
        ...category,
        places: placesForCategory(category.id, filteredPlaces),
      }))
      .filter((category) => category.places.length > 0 || (!deferredQuery && nicheFilter === 'all')),
    [filteredPlaces, nicheFilter, deferredQuery],
  );

  const shownSections = visibleSections.filter((category) => (
    deferredQuery || nicheFilter !== 'all' ? category.places.length > 0 : true
  ));

  const categoryCount = shownSections.length;
  const membershipBlock = otherStudios.length > 0 ? categoryCount + 1 : 0;
  const noteIndex = otherStudios.length > 0 ? categoryCount + 2 : Math.max(1, categoryCount + 1);
  const liveCount = allPlaces.filter((place) => place.live).length;
  const mockCount = allPlaces.length - liveCount;

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
            <h1>Što još nudi anyminutes</h1>
            <p className="member-discover__lede">
              {tenant?.name
                ? `${tenant.name} je jedan studio. Traži druge po imenu, gradu ili vrsti poslovanja.`
                : 'Traži studije po imenu, gradu ili vrsti poslovanja.'}
            </p>
          </div>
          {nicheMeta ? (
            <p className="member-discover__chip">
              <span>Ovdje ste</span>
              <strong>{nicheMeta.name}</strong>
            </p>
          ) : null}
        </header>

        <form
          className="member-discover__search"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            <span className="visually-hidden">Traži studio, grad ili vrstu</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Traži ime, grad, wellness, igraonica…"
              autoComplete="off"
            />
          </label>
          <p className="member-discover__search-note">
            {isLoading || isFetching
              ? 'Tražimo studije…'
              : isError
                ? 'Backend trenutno nije dostupan — prikazujemo lokalni razvojni popis.'
                : (
                  <>
                    {allPlaces.length}
                    {' '}
                    rezultata
                    {liveCount ? ` · ${liveCount} uživo` : ''}
                    {mockCount && DISCOVER_MOCK_ENABLED ? ` · ${mockCount} primjer` : ''}
                    {isFetching ? ' · osvježavanje…' : ''}
                  </>
                )}
          </p>
        </form>

        <div
          className="member-discover__niches-nav"
          role="tablist"
          aria-label="Niše poslovanja"
        >
          <button
            type="button"
            role="tab"
            aria-selected={nicheFilter === 'all'}
            className={nicheFilter === 'all' ? 'is-on' : undefined}
            onClick={() => setNicheFilter('all')}
          >
            Sve
            <span>{nicheCounts.all}</span>
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
              <span>{nicheCounts[category.id] || 0}</span>
            </button>
          ))}
        </div>

        {shownSections.length === 0 ? (
          <section className="member-discover__block">
            <p className="member-discover__empty">
              {deferredQuery
                ? `Nema rezultata za „${deferredQuery}”. Pokušajte drugi pojam.`
                : 'Još nema studija za prikaz u ovoj kategoriji.'}
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
                  <p className="member-discover__kicker">Kategorija</p>
                  <h2>{category.name}</h2>
                  <p>{category.note}</p>
                </div>
                <p className="member-discover__count">
                  <strong>{category.places.length}</strong>
                  <span>mjesta</span>
                </p>
              </header>
              <ul className="member-discover__places">
                {category.places.map((place) => (
                  <li
                    key={place.id}
                    className={categoryHere(category.id, currentNiche) ? 'is-related' : undefined}
                  >
                    <div>
                      <div className="member-discover__place-title">
                        <strong>{place.name}</strong>
                        {!place.live ? <em>Primjer</em> : null}
                      </div>
                      <p className="member-discover__place-meta">
                        {[place.city, place.area].filter(Boolean).join(' · ') || 'Hrvatska'}
                      </p>
                      <p className="member-discover__place-note">{place.note}</p>
                      {place.tags?.length ? (
                        <p className="member-discover__tags">
                          {place.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                    {place.live && place.slug ? (
                      <Link to={`/s/${place.slug}`}>Otvori</Link>
                    ) : (
                      <span className="member-discover__soon">Uskoro</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {otherStudios.length > 0 ? (
          <section className="member-discover__block">
            <header className="member-discover__panel-head">
              <span className="member-discover__index" aria-hidden="true">
                {String(membershipBlock).padStart(2, '0')}
              </span>
              <div>
                <p className="member-discover__kicker">Vaši studiji</p>
                <h2>Druge članarine</h2>
                <p>Studiji u kojima već imate aktivnu članarinu.</p>
              </div>
            </header>
            <ul className="member-discover__studios">
              {otherStudios.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>/{item.slug}</span>
                  </div>
                  <Link to={`/s/${item.slug}`}>Otvori</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="member-discover__block member-discover__block--note">
          <header className="member-discover__panel-head">
            <span className="member-discover__index" aria-hidden="true">
              {String(noteIndex).padStart(2, '0')}
            </span>
            <div>
              <p className="member-discover__kicker">Napomena</p>
              <h2>Nije marketplace</h2>
              <p>
                Pretraga čita aktivne studije s poslužitelja. Primjeri su samo za development.
                Svaki studio dijeli svoj link — anyminutes ne šalje članove konkurenciji u katalogu.
              </p>
            </div>
          </header>
          <div className="member-discover__actions">
            {slug ? (
              <Link className="member-discover__ghost" to={`/s/${slug}`}>
                Natrag na {tenant?.name || 'studio'}
              </Link>
            ) : null}
            <Link className="member-discover__primary" to="/">
              Početna anyminutes
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
