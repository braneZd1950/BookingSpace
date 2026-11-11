/** Map API failure to a user-facing booking create message. */
export function messageForCreateBookingError(failure, audience = 'member') {
  const code = failure?.code || failure?.data?.code;
  if (!failure?.status && failure?.message === 'Failed to fetch') {
    return 'Poslužitelj nije dostupan.';
  }
  if (code === 'SLOT_UNAVAILABLE') return 'Taj sat više nije slobodan.';
  if (code === 'MEMBERSHIP_REQUIRED' || code === 'NO_SESSIONS') {
    return audience === 'owner'
      ? 'Član nema aktivnu članarinu ili preostale termine.'
      : 'Nemate aktivnu članarinu ili preostale termine.';
  }
  if (code === 'BOOKING_CONFLICT') {
    return audience === 'owner'
      ? 'Član već ima rezervaciju u tom terminu.'
      : 'Već imate rezervaciju u tom terminu.';
  }
  if (code === 'STAFF_REQUIRED' || code === 'STAFF_UNAVAILABLE') {
    return 'Odaberite dostupnog trenera.';
  }
  if (code === 'CONSENT_REQUIRED') {
    return 'Potrebna je privola. Prihvatite je u Privatnost ili Postavke.';
  }
  return audience === 'owner' ? 'Rezervacija nije spremljena.' : 'Rezervacija nije uspjela.';
}

/** Map API failure to a user-facing cancel message. */
export function messageForCancelBookingError(failure, {
  cancelWindowLabel = '',
} = {}) {
  const code = failure?.code || failure?.data?.code;
  if (code === 'CANCELLATION_WINDOW') {
    return `Prekasno je za otkaz. Rok je ${cancelWindowLabel}.`;
  }
  if (code === 'CONSENT_REQUIRED') {
    return 'Potrebna je privola. Prihvatite je u Privatnost ili Postavke.';
  }
  if (!failure?.status && failure?.message === 'Failed to fetch') {
    return 'Poslužitelj nije dostupan.';
  }
  return 'Otkaz nije uspio.';
}
