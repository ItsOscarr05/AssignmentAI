import { useCallback, useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';

interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

interface TouchState {
  isTouching: boolean;
  touchStartX: number;
  touchStartY: number;
  currentX: number;
  currentY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

interface ResponsiveLayoutOptions {
  breakpoints?: Breakpoint[];
  defaultBreakpoint?: string;
  onBreakpointChange?: (breakpoint: string) => void;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', distance: number) => void;
  touchThreshold?: number;
}

const defaultBreakpoints: Breakpoint[] = [
  { name: 'xs', minWidth: 0, maxWidth: 599 },
  { name: 'sm', minWidth: 600, maxWidth: 959 },
  { name: 'md', minWidth: 960, maxWidth: 1279 },
  { name: 'lg', minWidth: 1280, maxWidth: 1919 },
  { name: 'xl', minWidth: 1920 },
];

export const useResponsiveLayout = (options: ResponsiveLayoutOptions = {}) => {
  const { trackError } = useErrorTracking();
  const { measurePerformance } = usePerformanceMonitoring();

  const {
    breakpoints = defaultBreakpoints,
    defaultBreakpoint = 'xs',
    onBreakpointChange,
    onOrientationChange,
    onSwipe,
    touchThreshold = 50,
  } = options;

  // Initialize state based on current window dimensions
  const getInitialState = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const initialBreakpoint =
      breakpoints.find(bp => width >= bp.minWidth && (!bp.maxWidth || width <= bp.maxWidth))
        ?.name || defaultBreakpoint;

    return {
      breakpoint: initialBreakpoint,
      isMobile: initialBreakpoint === 'xs',
      isTablet: initialBreakpoint === 'sm' || initialBreakpoint === 'md',
      isDesktop: initialBreakpoint === 'lg' || initialBreakpoint === 'xl',
      isLandscape: width > height,
    };
  };

  const [currentBreakpoint, setCurrentBreakpoint] = useState(getInitialState().breakpoint);
  const [isMobile, setIsMobile] = useState(getInitialState().isMobile);
  const [isTablet, setIsTablet] = useState(getInitialState().isTablet);
  const [isDesktop, setIsDesktop] = useState(getInitialState().isDesktop);
  const [isLandscape, setIsLandscape] = useState(getInitialState().isLandscape);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    touchStartX: 0,
    touchStartY: 0,
    currentX: 0,
    currentY: 0,
    direction: null,
    distance: 0,
  });

  const updateBreakpoint = useCallback(
    (width: number) => {
      const newBreakpoint =
        breakpoints.find(bp => width >= bp.minWidth && (!bp.maxWidth || width <= bp.maxWidth))
          ?.name || defaultBreakpoint;

      if (newBreakpoint !== currentBreakpoint) {
        setCurrentBreakpoint(newBreakpoint);
        setIsMobile(newBreakpoint === 'xs');
        setIsTablet(newBreakpoint === 'sm' || newBreakpoint === 'md');
        setIsDesktop(newBreakpoint === 'lg' || newBreakpoint === 'xl');
        onBreakpointChange?.(newBreakpoint);
      }
    },
    [breakpoints, currentBreakpoint, defaultBreakpoint, onBreakpointChange]
  );

  const handleResize = useCallback(() => {
    measurePerformance('handleResize', () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const newIsLandscape = width > height;

        updateBreakpoint(width);
        setIsLandscape(newIsLandscape);
        onOrientationChange?.(newIsLandscape ? 'landscape' : 'portrait');
      } catch (error) {
        trackError('Error in handleResize', error);
      }
    });
  }, [measurePerformance, onOrientationChange, trackError, updateBreakpoint]);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      try {
        const touch = event.touches[0];
        setTouchState({
          isTouching: true,
          touchStartX: touch.clientX,
          touchStartY: touch.clientY,
          currentX: touch.clientX,
          currentY: touch.clientY,
          direction: null,
          distance: 0,
        });
        setIsTouchDevice(true);
      } catch (error) {
        trackError('Error in handleTouchStart', error);
      }
    },
    [trackError]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      try {
        const touch = event.touches[0];
        const deltaX = touch.clientX - touchState.touchStartX;
        const deltaY = touch.clientY - touchState.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const direction =
          Math.abs(deltaX) > Math.abs(deltaY)
            ? deltaX > 0
              ? 'right'
              : 'left'
            : deltaY > 0
            ? 'down'
            : 'up';

        setTouchState(prev => ({
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY,
          direction,
          distance,
        }));
      } catch (error) {
        trackError('Error in handleTouchMove', error);
      }
    },
    [touchState.touchStartX, touchState.touchStartY, trackError]
  );

  const handleTouchEnd = useCallback(() => {
    try {
      if (touchState.distance >= touchThreshold && touchState.direction) {
        onSwipe?.(touchState.direction, touchState.distance);
      }

      setTouchState({
        isTouching: false,
        touchStartX: 0,
        touchStartY: 0,
        currentX: 0,
        currentY: 0,
        direction: null,
        distance: 0,
      });
    } catch (error) {
      trackError('Error in handleTouchEnd', error);
    }
  }, [onSwipe, touchState.direction, touchState.distance, touchThreshold, trackError]);

  useEffect(() => {
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleResize, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isTouchDevice,
    touchState,
  };
};

// Example usage:
/*
const ResponsiveComponent: React.FC = () => {
  const {
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isTouchDevice,
    touchState,
  } = useResponsiveLayout({
    onBreakpointChange: (breakpoint) => {
      console.log(`Breakpoint changed to: ${breakpoint}`);
    },
    onOrientationChange: (orientation) => {
      console.log(`Orientation changed to: ${orientation}`);
    },
    onSwipe: (direction, distance) => {
      console.log(`Swipe detected: ${direction} with distance ${distance}`);
    },
  });

  return (
    <div>
      <h2>Responsive Layout Demo</h2>
      <div>Current Breakpoint: {currentBreakpoint}</div>
      <div>Device Type: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
      <div>Orientation: {isLandscape ? 'Landscape' : 'Portrait'}</div>
      {isTouchDevice && (
        <div>
          Touch Direction: {touchState.direction || 'none'}
          Touch Distance: {touchState.distance}
        </div>
      )}
    </div>
  );
};
*/
