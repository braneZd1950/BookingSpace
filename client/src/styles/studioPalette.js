const siteType = 'Figtree, sans-serif';

function palette(id, name, primary, soft, canvas, ink) {
  return {
    id,
    name,
    theme: {
      primaryColor: primary,
      secondaryColor: soft,
      fontFamily: siteType,
      borderRadius: '0.5rem',
      buttonStyle: 'soft',
      canvas,
      ink,
      onPrimary: '#ffffff',
    },
  };
}

/** ~16–18 nijansi za izbor prilikom registracije / postavljanja. */
export const studioPalettes = [
  palette('navy', 'Tamnoplava', '#243056', '#d9e0ef', '#f6f7fb', '#1c2233'),
  palette('cobalt', 'Kobalt', '#2a4e8f', '#d4e2f7', '#f5f8fc', '#172033'),
  palette('ocean', 'Ocean', '#1a5f7a', '#cfe6ef', '#f3f8fa', '#14323d'),
  palette('teal', 'Petrol', '#0e6b73', '#dceff0', '#f4f9f9', '#123238'),
  palette('pine', 'Bor', '#3e5c45', '#d5e3d4', '#f5f7f3', '#1c261e'),
  palette('moss', 'Mahovina', '#4a6b3a', '#dce8d4', '#f6f9f3', '#22301c'),
  palette('olive', 'Maslina', '#6b6b3a', '#e6e6d0', '#f8f8f2', '#2c2c1a'),
  palette('wine', 'Vino', '#7a3048', '#f0d5de', '#fbf7f8', '#2c1a22'),
  palette('rose', 'Ruza', '#9a4a5c', '#f2dce2', '#fbf6f7', '#321c22'),
  palette('plum', 'Šljiva', '#5a3d6b', '#e6d9ef', '#f8f6fa', '#24182c'),
  palette('violet', 'Ljubičasta', '#4f3d8f', '#ddd6f5', '#f6f5fb', '#1f1a33'),
  palette('clay', 'Glina', '#a35b3c', '#f0ddcf', '#faf6f2', '#2b211c'),
  palette('copper', 'Bakar', '#8f4e2a', '#f3e4c8', '#fbf8f3', '#2a2118'),
  palette('sand', 'Pijesak', '#9a7b4f', '#efe4d0', '#faf7f1', '#2c2418'),
  palette('stone', 'Kamen', '#3a3f45', '#e3e1dc', '#f7f6f4', '#1e2124'),
  palette('slate', 'Škriljavac', '#4a5560', '#dde2e6', '#f5f6f7', '#1c2228'),
  palette('ink', 'Tinta', '#1a1a1a', '#e4e4e4', '#f7f7f7', '#141414'),
  palette('ember', 'Žar', '#b33b2e', '#f3d5d0', '#fbf5f4', '#2c1614'),
];

export function findPalette(id) {
  return studioPalettes.find((item) => item.id === id) || studioPalettes[0];
}

export function themePayload(theme) {
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    fontFamily: theme.fontFamily,
    borderRadius: theme.borderRadius,
    buttonStyle: theme.buttonStyle,
  };
}
