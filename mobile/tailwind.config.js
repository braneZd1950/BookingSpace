/** Mirrors client/src/styles/tokens.scss — keep sync with src/theme/tokens.ts */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#f5f8f8',
        surface: '#ffffff',
        line: '#d9e2e3',
        fg: '#112b2e',
        muted: '#55696c',
        brand: {
          DEFAULT: '#0e6b73',
          strong: '#0a4f56',
          soft: '#dceff0',
          on: '#ffffff',
        },
        accent: '#f2a33a',
        ok: '#1f8a5b',
        full: '#c73e3e',
      },
      fontFamily: {
        sans: ['Figtree_500Medium'],
        display: ['Fraunces_600SemiBold'],
        brand: ['SourceSerif4_600SemiBold'],
      },
      borderRadius: {
        DEFAULT: '3.2px',
      },
    },
  },
  plugins: [],
};
