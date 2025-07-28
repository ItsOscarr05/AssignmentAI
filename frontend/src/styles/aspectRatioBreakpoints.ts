import { AspectRatioBreakpoint } from '../hooks/useAspectRatio';

// Aspect ratio breakpoints for responsive design
export const aspectRatioBreakpoints: AspectRatioBreakpoint[] = [
  {
    name: 'ultra-wide',
    minRatio: 2.0,
    description: 'Ultra-wide displays (21:9, 32:9)',
    commonDevices: ['Ultra-wide monitors', 'Gaming displays', 'Cinema displays'],
  },
  {
    name: 'wide',
    minRatio: 1.78, // 16:9 aspect ratio
    maxRatio: 1.99,
    description: 'Wide displays (16:9 and wider)',
    commonDevices: ['Desktop monitors', 'Laptops', 'TVs', 'Most phones in landscape'],
  },
  {
    name: 'standard',
    minRatio: 1.2,
    maxRatio: 1.77,
    description: 'Standard displays (4:3, 3:2, below 16:9)',
    commonDevices: ['Tablets', 'Some laptops', 'Older monitors', 'Smaller windows'],
  },
  {
    name: 'square',
    minRatio: 0.9,
    maxRatio: 1.19,
    description: 'Square-ish displays',
    commonDevices: ['Some tablets', 'Foldables', 'Square displays'],
  },
  {
    name: 'tall',
    minRatio: 0,
    maxRatio: 0.89,
    description: 'Tall displays (portrait phones)',
    commonDevices: ['Phones in portrait', 'Some tablets in portrait'],
  },
];

// Responsive styles based on aspect ratios
export const aspectRatioStyles = {
  container: {
    padding: {
      'ultra-wide': 6,
      wide: 4,
      standard: 3,
      square: 2,
      tall: 2,
    },
    maxWidth: {
      'ultra-wide': '100%',
      wide: '1400px',
      standard: '1200px',
      square: '1000px',
      tall: '100%',
    },
  },
  typography: {
    h1: {
      fontSize: {
        'ultra-wide': '3rem',
        wide: '2.5rem',
        standard: '2rem',
        square: '1.75rem',
        tall: '1.5rem',
      },
    },
    h2: {
      fontSize: {
        'ultra-wide': '2.5rem',
        wide: '2rem',
        standard: '1.75rem',
        square: '1.5rem',
        tall: '1.25rem',
      },
    },
    body1: {
      fontSize: {
        'ultra-wide': '1.125rem',
        wide: '1rem',
        standard: '1rem',
        square: '0.875rem',
        tall: '0.875rem',
      },
    },
  },
  spacing: {
    section: {
      padding: {
        'ultra-wide': 6,
        wide: 4,
        standard: 3,
        square: 2,
        tall: 2,
      },
    },
    element: {
      margin: {
        'ultra-wide': 4,
        wide: 3,
        standard: 2,
        square: 2,
        tall: 1,
      },
    },
  },
  grid: {
    columns: {
      'ultra-wide': 4,
      wide: 2, // Horizontal layout for 16:9 and wider
      standard: 1, // Vertical stacking for below 16:9
      square: 1, // Vertical stacking for below 16:9
      tall: 1, // Vertical stacking for below 16:9
    },
    gap: {
      'ultra-wide': 4,
      wide: 3,
      standard: 2,
      square: 2,
      tall: 1,
    },
  },
  navigation: {
    sidebar: {
      width: {
        'ultra-wide': '280px',
        wide: '240px',
        standard: '220px',
        square: '200px',
        tall: '100%',
      },
    },
    header: {
      height: {
        'ultra-wide': '80px',
        wide: '70px',
        standard: '64px',
        square: '60px',
        tall: '56px',
      },
    },
  },
  cards: {
    padding: {
      'ultra-wide': 4,
      wide: 3,
      standard: 2,
      square: 2,
      tall: 1,
    },
    borderRadius: {
      'ultra-wide': '12px',
      wide: '8px',
      standard: '8px',
      square: '6px',
      tall: '4px',
    },
    imageHeight: {
      'ultra-wide': 300,
      wide: 250,
      standard: 200,
      square: 180,
      tall: 150,
    },
  },
  forms: {
    inputHeight: {
      'ultra-wide': '56px',
      wide: '48px',
      standard: '44px',
      square: '40px',
      tall: '44px',
    },
    buttonHeight: {
      'ultra-wide': '56px',
      wide: '48px',
      standard: '44px',
      square: '40px',
      tall: '44px',
    },
  },
};

// Utility function to get style value for current breakpoint
export const getAspectRatioStyle = (
  styleObject: Record<string, any>,
  breakpoint: string,
  fallback?: any
) => {
  return styleObject[breakpoint] || fallback || styleObject['standard'];
};

// CSS media queries based on aspect ratios
export const aspectRatioMediaQueries = {
  'ultra-wide': '(min-aspect-ratio: 2/1)',
  wide: '(min-aspect-ratio: 16/9) and (max-aspect-ratio: 2/1)', // 16:9 and wider
  standard: '(min-aspect-ratio: 6/5) and (max-aspect-ratio: 16/9)', // Below 16:9
  square: '(min-aspect-ratio: 9/10) and (max-aspect-ratio: 6/5)',
  tall: '(max-aspect-ratio: 9/10)',
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
};

// Helper function to create responsive CSS
export const createAspectRatioCSS = (styles: Record<string, any>) => {
  return Object.entries(styles)
    .map(([breakpoint, value]) => {
      const mediaQuery =
        aspectRatioMediaQueries[breakpoint as keyof typeof aspectRatioMediaQueries];
      if (!mediaQuery) return '';

      return `
        @media ${mediaQuery} {
          ${Object.entries(value)
            .map(([property, val]) => `${property}: ${val};`)
            .join('\n          ')}
        }
      `;
    })
    .join('\n');
};
