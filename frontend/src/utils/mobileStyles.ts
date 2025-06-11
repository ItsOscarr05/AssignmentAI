import { CSSProperties } from 'react';

interface MobileStyleOptions {
  isMobile: boolean;
  isTablet: boolean;
  orientation: 'portrait' | 'landscape';
  windowWidth: number;
  windowHeight: number;
}

interface ResponsiveStyle {
  base: CSSProperties;
  mobile?: CSSProperties;
  tablet?: CSSProperties;
  desktop?: CSSProperties;
  portrait?: CSSProperties;
  landscape?: CSSProperties;
}

export const createResponsiveStyle = (
  style: ResponsiveStyle,
  options: MobileStyleOptions
): CSSProperties => {
  const { isMobile, isTablet, orientation } = options;

  // Start with base styles
  let responsiveStyle: CSSProperties = { ...style.base };

  // Apply device-specific styles
  if (isMobile && style.mobile) {
    responsiveStyle = { ...responsiveStyle, ...style.mobile };
  } else if (isTablet && style.tablet) {
    responsiveStyle = { ...responsiveStyle, ...style.tablet };
  } else if (!isMobile && !isTablet && style.desktop) {
    responsiveStyle = { ...responsiveStyle, ...style.desktop };
  }

  // Apply orientation-specific styles
  if (orientation === 'portrait' && style.portrait) {
    responsiveStyle = { ...responsiveStyle, ...style.portrait };
  } else if (orientation === 'landscape' && style.landscape) {
    responsiveStyle = { ...responsiveStyle, ...style.landscape };
  }

  return responsiveStyle;
};

// Common mobile-specific styles
export const mobileStyles = {
  // Layout
  container: {
    base: {
      width: '100%',
      maxWidth: '100%',
      padding: '1rem',
    },
    mobile: {
      padding: '0.5rem',
    },
    tablet: {
      padding: '1rem',
    },
    desktop: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
  },

  // Navigation
  navigation: {
    base: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 1000,
    },
    mobile: {
      height: '60px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tablet: {
      height: '70px',
    },
    desktop: {
      position: 'static',
      height: 'auto',
      display: 'flex',
      flexDirection: 'row',
      padding: '1rem',
    },
  },

  // Cards
  card: {
    base: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '1rem',
      marginBottom: '1rem',
    },
    mobile: {
      borderRadius: '4px',
      padding: '0.75rem',
      marginBottom: '0.75rem',
    },
    tablet: {
      borderRadius: '6px',
      padding: '1rem',
    },
  },

  // Buttons
  button: {
    base: {
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: '#007bff',
      color: '#ffffff',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    mobile: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      touchAction: 'manipulation',
    },
    tablet: {
      padding: '0.5rem 1rem',
      fontSize: '0.9rem',
    },
  },

  // Forms
  form: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    mobile: {
      gap: '0.75rem',
    },
    tablet: {
      gap: '1rem',
    },
  },

  // Input fields
  input: {
    base: {
      padding: '0.5rem',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '1rem',
    },
    mobile: {
      padding: '0.75rem',
      fontSize: '1rem',
      touchAction: 'manipulation',
    },
    tablet: {
      padding: '0.5rem',
      fontSize: '0.9rem',
    },
  },

  // Lists
  list: {
    base: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    mobile: {
      padding: '0.5rem',
    },
    tablet: {
      padding: '1rem',
    },
  },

  // Grid layouts
  grid: {
    base: {
      display: 'grid',
      gap: '1rem',
    },
    mobile: {
      gridTemplateColumns: '1fr',
      gap: '0.75rem',
    },
    tablet: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
    },
    desktop: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1.5rem',
    },
  },

  // Animations
  fadeIn: {
    base: {
      animation: 'fadeIn 0.3s ease-in-out',
    },
  },

  slideIn: {
    base: {
      animation: 'slideIn 0.3s ease-in-out',
    },
  },

  // Modal
  modal: {
    base: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    mobile: {
      padding: '1rem',
    },
    tablet: {
      padding: '2rem',
    },
  },

  // Drawer
  drawer: {
    base: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#ffffff',
      zIndex: 1000,
    },
    mobile: {
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
    },
    tablet: {
      width: '300px',
      right: 'auto',
    },
    desktop: {
      width: '300px',
      right: 'auto',
    },
  },
};

// Animation keyframes
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  slideIn: `
    @keyframes slideIn {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `,
};

// Example usage:
/*
const MyComponent: React.FC = () => {
  const {
    isMobile,
    isTablet,
    orientation,
    windowWidth,
    windowHeight,
  } = useResponsiveLayout();

  const style = createResponsiveStyle(mobileStyles.container, {
    isMobile,
    isTablet,
    orientation,
    windowWidth,
    windowHeight,
  });

  return (
    <div style={style}>
      <h1>Responsive Content</h1>
      <p>This content adapts to different screen sizes and orientations.</p>
    </div>
  );
};
*/
