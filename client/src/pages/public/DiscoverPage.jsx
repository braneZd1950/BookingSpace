import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDiscoverTenantsQuery } from '../../api/tenantApi.js';
import SeoHead from '../../components/SeoHead.jsx';
import {
  DiscoverAtmosphere,
  DiscoverCategoryTabs,
  DiscoverEmptyState,
  DiscoverPlaceSections,
  DiscoverSearchForm,
} from '../../components/discover/DiscoverListingParts.jsx';
import {
  countsFromPlaces,
  discoverCategories,
  placesForCategory,
} from '../../lib/discoverCategories.js';
import { normalizeDiscoverPlace } from '../../lib/discoverNormalize.js';
import { DISCOVER_VISIBILITY } from '../../lib/discoverVisibility.js';
import '../member/MemberDiscoverPage.scss';

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
      .map((place) => normalizeDiscoverPlace({
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
      <SeoHead
        title="Otkrij usluge i studije — Blizari"
        description="Pregledajte javno otkrivene studije i usluge. Rezervirajte izravno na stranici poslovanja koje odaberete."
        path="/otkrij"
      />
      <DiscoverAtmosphere />

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

        <DiscoverSearchForm
          query={query}
          onQueryChange={setQuery}
          label="Pretraživanje"
          placeholder="Pronađite poslovanje, uslugu, aktivnost ili grad."
          status={(
            <>
              {searching ? (
                <p className="member-discover__search-note">Tražimo dostupna mjesta…</p>
              ) : null}
              {!searching && isError ? (
                <p className="member-discover__search-note">
                  Trenutačno ne možemo učitati popis. Pokušajte ponovno uskoro.
                </p>
              ) : null}
            </>
          )}
        />

        <DiscoverCategoryTabs
          nicheFilter={nicheFilter}
          onFilterChange={setNicheFilter}
          nicheCounts={nicheCounts}
        />

        {shownSections.length === 0 ? (
          <DiscoverEmptyState
            deferredQuery={deferredQuery}
            fallback="Još nema javno vidljivih poslovanja. Vlasnici koji žele nove klijente mogu uključiti prikaz u Otkrij."
          />
        ) : (
          <DiscoverPlaceSections sections={shownSections} />
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
