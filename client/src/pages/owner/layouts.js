export const pageLayouts = [
  {
    id: 'banner',
    name: 'Naslovnica',
    note: 'Pun header preko vrha. Ispod: termini, sati i kontakt.',
  },
  {
    id: 'bar',
    name: 'Traka',
    note: 'Uski header s nazivom i gumbom. Sadržaj kreće odmah ispod.',
  },
  {
    id: 'sidebar',
    name: 'Stupac',
    note: 'Header + bočni stupac (kontakt, sati) + termini u sredini.',
  },
];

export function findLayout(id) {
  return pageLayouts.find((item) => item.id === id) || pageLayouts[0];
}
