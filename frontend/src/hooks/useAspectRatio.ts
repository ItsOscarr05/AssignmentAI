import { useCallback, useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';

export interface AspectRatioBreakpoint {
  name: string;
  minRatio: number;
  maxRatio?: number;
  description: string;
  commonDevices: string[];
}

export interface AspectRatioState {
  width: number;
  height: number;
  ratio: number;
  breakpoint: string;
  orientation: 'portrait' | 'landscape' | 'square';
  isUltraWide: boolean;
  isWide: boolean;
  isStandard: boolean;
  isSquare: boolean;
  isTall: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface UseAspectRatioOptions {
  breakpoints?: AspectRatioBreakpoint[];
  defaultBreakpoint?: string;
  onBreakpointChange?: (breakpoint: string) => void;
  onOrientationChange?: (orientation: 'portrait' | 'landscape' | 'square') => void;
  onRatioChange?: (ratio: number) => void;
  debounceMs?: number;
}

// Default aspect ratio breakpoints
export const defaultAspectRatioBreakpoints: AspectRatioBreakpoint[] = [
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

// Device type classification based on aspect ratio and size
const classifyDeviceType = (
  ratio: number,
  width: number,
  height: number
): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} => {
  const area = width * height;

  // Mobile: typically tall aspect ratio and smaller screen area
  if (ratio < 0.9 && area < 500000) {
    // < 500k pixels (roughly 800x625)
    return { isMobile: true, isTablet: false, isDesktop: false };
  }

  // Tablet: medium aspect ratio and medium screen area
  if (ratio >= 0.9 && ratio <= 1.77 && area >= 500000 && area < 2000000) {
    // 500k to 2M pixels, below 16:9
    return { isMobile: false, isTablet: true, isDesktop: false };
  }

  // Desktop: wider aspect ratios or larger screen areas
  return { isMobile: false, isTablet: false, isDesktop: true };
};

export const useAspectRatio = (options: UseAspectRatioOptions = {}) => {
  const { trackError } = useErrorTracking();
  usePerformanceMonitoring('useAspectRatio');

  const {
    breakpoints = defaultAspectRatioBreakpoints,
    defaultBreakpoint = 'standard',
    onBreakpointChange,
    onOrientationChange,
    onRatioChange,
    debounceMs = 100,
  } = options;

  const [state, setState] = useState<AspectRatioState>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;

    const initialBreakpoint =
      breakpoints.find(bp => ratio >= bp.minRatio && (!bp.maxRatio || ratio <= bp.maxRatio))
        ?.name || defaultBreakpoint;

    const orientation = ratio > 1.1 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square';
    const deviceType = classifyDeviceType(ratio, width, height);

    return {
      width,
      height,
      ratio,
      breakpoint: initialBreakpoint,
      orientation,
      isUltraWide: initialBreakpoint === 'ultra-wide',
      isWide: initialBreakpoint === 'wide',
      isStandard: initialBreakpoint === 'standard',
      isSquare: initialBreakpoint === 'square',
      isTall: initialBreakpoint === 'tall',
      ...deviceType,
    };
  });

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const updateAspectRatio = useCallback(() => {
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;

      const newBreakpoint =
        breakpoints.find(bp => ratio >= bp.minRatio && (!bp.maxRatio || ratio <= bp.maxRatio))
          ?.name || defaultBreakpoint;

      const orientation = ratio > 1.1 ? 'landscape' : ratio < 0.9 ? 'portrait' : 'square';
      const deviceType = classifyDeviceType(ratio, width, height);

      const newState: AspectRatioState = {
        width,
        height,
        ratio,
        breakpoint: newBreakpoint,
        orientation,
        isUltraWide: newBreakpoint === 'ultra-wide',
        isWide: newBreakpoint === 'wide',
        isStandard: newBreakpoint === 'standard',
        isSquare: newBreakpoint === 'square',
        isTall: newBreakpoint === 'tall',
        ...deviceType,
      };

      setState(prevState => {
        const hasChanged =
          prevState.breakpoint !== newState.breakpoint ||
          prevState.orientation !== newState.orientation ||
          Math.abs(prevState.ratio - newState.ratio) > 0.01;

        if (hasChanged) {
          if (prevState.breakpoint !== newState.breakpoint) {
            onBreakpointChange?.(newState.breakpoint);
          }
          if (prevState.orientation !== newState.orientation) {
            onOrientationChange?.(newState.orientation);
          }
          onRatioChange?.(newState.ratio);
        }

        return newState;
      });
    } catch (error) {
      trackError(
        { message: 'Error in updateAspectRatio', error: error as Error },
        'useAspectRatio'
      );
    }
  }, [
    breakpoints,
    defaultBreakpoint,
    onBreakpointChange,
    onOrientationChange,
    onRatioChange,
    trackError,
  ]);

  const handleResize = useCallback(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      updateAspectRatio();
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [debounceMs, debounceTimeout, updateAspectRatio]);

  useEffect(() => {
    updateAspectRatio();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [handleResize, debounceTimeout, updateAspectRatio]);

  // Utility functions
  const getBreakpointInfo = useCallback(() => {
    return breakpoints.find(bp => bp.name === state.breakpoint);
  }, [breakpoints, state.breakpoint]);

  const isBreakpoint = useCallback(
    (breakpointName: string) => {
      return state.breakpoint === breakpointName;
    },
    [state.breakpoint]
  );

  const isBreakpointOrLarger = useCallback(
    (breakpointName: string) => {
      const currentIndex = breakpoints.findIndex(bp => bp.name === state.breakpoint);
      const targetIndex = breakpoints.findIndex(bp => bp.name === breakpointName);
      return currentIndex >= targetIndex;
    },
    [breakpoints, state.breakpoint]
  );

  const isBreakpointOrSmaller = useCallback(
    (breakpointName: string) => {
      const currentIndex = breakpoints.findIndex(bp => bp.name === state.breakpoint);
      const targetIndex = breakpoints.findIndex(bp => bp.name === breakpointName);
      return currentIndex <= targetIndex;
    },
    [breakpoints, state.breakpoint]
  );

  return {
    ...state,
    getBreakpointInfo,
    isBreakpoint,
    isBreakpointOrLarger,
    isBreakpointOrSmaller,
    breakpoints,
  };
};
