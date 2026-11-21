/** Mobile home quick-nav — member + owner (single schema, one source). */

function item(id, label, note, icon) {
  return { id, label, note, icon };
}

export const MEMBER_HOME_NAV = [
  item('book', 'Termini', 'Rezervacija i otkaz', 'time-outline'),
  item('calendar', 'Kalendar', 'Zauzetost po danima', 'calendar-outline'),
  item('gallery', 'Galerija', 'Fotografije studija', 'images-outline'),
  item('discover', 'Otkrij', 'Usluge i mjesta', 'compass-outline'),
  item('privacy', 'Privatnost', 'Dokumenti studija', 'shield-checkmark-outline'),
  item('settings', 'Postavke', 'Račun i obavijesti', 'settings-outline'),
];

export const STUDIO_HOME_NAV = [
  item('bookings', 'Termini', 'Raspored i rezervacije', 'calendar-outline'),
  item('calendar', 'Kalendar', 'Zauzetost po mjesecu', 'grid-outline'),
  item('members', 'Članovi', 'Članarine i klijenti', 'people-outline'),
  item('services', 'Usluge', 'Ponuda za klijente', 'list-outline'),
  item('analytics', 'Analitika', 'Uvidi i članarine', 'stats-chart-outline'),
  item('settings', 'Postavke', 'Račun i obavijesti', 'settings-outline'),
];
