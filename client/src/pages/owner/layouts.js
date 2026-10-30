export const pageLayouts = [
  {
    id: 'banner',
    name: 'Naslovnica',
    note: 'Široki header. Ispod: termini, sati i kontakt.',
  },
  {
    id: 'bar',
    name: 'Traka',
    note: 'Uski header. Sadržaj kreće odmah ispod.',
  },
  {
    id: 'sidebar',
    name: 'Stupac',
    note: 'Header + bočna traka za kontakt i sate.',
  },
];

export function findLayout(id) {
  return pageLayouts.find((item) => item.id === id) || pageLayouts[0];
}
