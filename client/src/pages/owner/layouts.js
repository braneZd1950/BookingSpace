export const pageLayouts = [
  {
    id: 'banner',
    name: 'Naslovnica',
    note: 'Široki header, ispod termini, sati i kontakt.',
  },
  {
    id: 'bar',
    name: 'Traka',
    note: 'Uski header, sadržaj kreće odmah ispod.',
  },
  {
    id: 'sidebar',
    name: 'Stupac',
    note: 'Header s bočnom trakom za kontakt i sate.',
  },
];

export function findLayout(id) {
  return pageLayouts.find((item) => item.id === id) || pageLayouts[0];
}
