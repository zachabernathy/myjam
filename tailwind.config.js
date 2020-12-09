module.exports = {
  purge: false,
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
    },
    screens: {
      'sm': '640px',
      'lg': '1024px',
      'xl': '1280px',
    },
    padding: {
      0: '0',
      1: '.25rem',
      2: '.5rem',
      3: '1rem',
      4: '2rem',
      5: '3rem',
    },
    margin: {
      0: '0',
      1: '.25rem',
      2: '.5rem',
      3: '1rem',
      4: '2rem',
      5: '3rem',
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
  corePlugins: [
    'backgroundColor',
    'margin',
    'padding',
    'textColor',
  ],
}
