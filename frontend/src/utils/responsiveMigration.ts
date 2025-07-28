import { useAspectRatio } from '../hooks/useAspectRatio';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * Migration utility to help transition from pixel-based to aspect ratio-based responsive design
 */
export const useResponsiveMigration = (
  options: {
    useAspectRatio?: boolean;
    fallbackToPixel?: boolean;
  } = {}
) => {
  const { useAspectRatio: useAspectRatioMode = true, fallbackToPixel = true } = options;

  // Use the new aspect ratio system
  const aspectRatioState = useAspectRatioMode ? useAspectRatio() : null;

  // Fallback to pixel-based system if needed
  const pixelState = fallbackToPixel ? useResponsiveLayout({ useAspectRatio: false }) : null;

  // Determine which state to use
  const isUsingAspectRatio = useAspectRatioMode && aspectRatioState;
  const activeState = isUsingAspectRatio ? aspectRatioState : pixelState;

  return {
    // Current responsive state
    ...activeState,

    // Migration helpers
    isUsingAspectRatio,
    aspectRatioState,
    pixelState,

    // Utility functions for migration
    getResponsiveValue: <T>(
      aspectRatioValues: Record<string, T>,
      pixelValues: Record<string, T>,
      defaultValue: T
    ): T => {
      if (isUsingAspectRatio && aspectRatioState) {
        return aspectRatioValues[aspectRatioState.breakpoint] || defaultValue;
      }
      if (pixelState) {
        return pixelValues[pixelState.currentBreakpoint] || defaultValue;
      }
      return defaultValue;
    },

    // Convert pixel breakpoints to aspect ratio breakpoints
    mapPixelToAspectRatio: (pixelBreakpoint: string): string => {
      const mapping: Record<string, string> = {
        xs: 'tall',
        sm: 'square',
        md: 'standard',
        lg: 'wide',
        xl: 'ultra-wide',
      };
      return mapping[pixelBreakpoint] || 'standard';
    },

    // Convert aspect ratio breakpoints to pixel breakpoints
    mapAspectRatioToPixel: (aspectRatioBreakpoint: string): string => {
      const mapping: Record<string, string> = {
        tall: 'xs',
        square: 'sm',
        standard: 'md',
        wide: 'lg',
        'ultra-wide': 'xl',
      };
      return mapping[aspectRatioBreakpoint] || 'md';
    },
  };
};

/**
 * Helper function to create responsive styles that work with both systems
 */
export const createResponsiveStyles = (
  aspectRatioStyles: Record<string, any>,
  pixelStyles: Record<string, any>,
  options: { useAspectRatio?: boolean } = {}
) => {
  const { useAspectRatio: useAspectRatioMode = true } = options;

  if (useAspectRatioMode) {
    return aspectRatioStyles;
  }

  return pixelStyles;
};

/**
 * Migration hook for components that need to support both systems
 */
export const useLegacyResponsive = (
  options: {
    useAspectRatio?: boolean;
    onMigration?: () => void;
  } = {}
) => {
  const { useAspectRatio: useAspectRatioMode = false, onMigration } = options;

  const migrationState = useResponsiveMigration({
    useAspectRatio: useAspectRatioMode,
    fallbackToPixel: true,
  });

  // Call migration callback when switching to aspect ratio mode
  if (useAspectRatioMode && onMigration) {
    onMigration();
  }

  return migrationState;
};
