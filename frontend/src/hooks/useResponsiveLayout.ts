import { useCallback, useEffect, useState } from "react";
import { usePerformanceMonitoring } from "../utils/performance";
import { useErrorTracking } from "./useErrorTracking";

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
  direction: "left" | "right" | "up" | "down" | null;
  distance: number;
}

interface ResponsiveLayoutOptions {
  breakpoints?: Breakpoint[];
  defaultBreakpoint?: string;
  touchThreshold?: number;
  onBreakpointChange?: (breakpoint: string) => void;
  onSwipe?: (direction: string, distance: number) => void;
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: "xs", minWidth: 0, maxWidth: 599 },
  { name: "sm", minWidth: 600, maxWidth: 959 },
  { name: "md", minWidth: 960, maxWidth: 1279 },
  { name: "lg", minWidth: 1280, maxWidth: 1919 },
  { name: "xl", minWidth: 1920 },
];

export const useResponsiveLayout = (options: ResponsiveLayoutOptions = {}) => {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    defaultBreakpoint = "xs",
    touchThreshold = 50,
    onBreakpointChange,
    onSwipe,
  } = options;

  const { trackError } = useErrorTracking();
  usePerformanceMonitoring("ResponsiveLayout");

  const [currentBreakpoint, setCurrentBreakpoint] = useState(defaultBreakpoint);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    touchStartX: 0,
    touchStartY: 0,
    currentX: 0,
    currentY: 0,
    direction: null,
    distance: 0,
  });

  // Update breakpoint based on window width
  const updateBreakpoint = useCallback(() => {
    const width = window.innerWidth;
    const newBreakpoint =
      breakpoints.find(
        (bp) => width >= bp.minWidth && (!bp.maxWidth || width <= bp.maxWidth)
      )?.name || defaultBreakpoint;

    if (newBreakpoint !== currentBreakpoint) {
      setCurrentBreakpoint(newBreakpoint);
      setIsMobile(newBreakpoint === "xs");
      setIsTablet(newBreakpoint === "sm" || newBreakpoint === "md");
      setIsDesktop(newBreakpoint === "lg" || newBreakpoint === "xl");
      onBreakpointChange?.(newBreakpoint);
    }
  }, [breakpoints, currentBreakpoint, defaultBreakpoint, onBreakpointChange]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateBreakpoint();
    };

    window.addEventListener("resize", handleResize);
    updateBreakpoint(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateBreakpoint]);

  // Handle touch events
  const handleTouchStart = useCallback((event: TouchEvent) => {
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
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    setTouchState((prev) => {
      const deltaX = touch.clientX - prev.touchStartX;
      const deltaY = touch.clientY - prev.touchStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let direction: "left" | "right" | "up" | "down" | null = null;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }

      return {
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        direction,
        distance,
      };
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTouchState((prev) => {
      if (prev.distance >= touchThreshold && prev.direction) {
        onSwipe?.(prev.direction, prev.distance);
      }

      return {
        ...prev,
        isTouching: false,
        direction: null,
        distance: 0,
      };
    });
  }, [touchThreshold, onSwipe]);

  // Add touch event listeners
  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle orientation change
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    window.innerHeight > window.innerWidth ? "portrait" : "landscape"
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      );
    };

    window.addEventListener("resize", handleOrientationChange);
    return () => {
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return {
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    touchState,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
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
    orientation,
    touchState,
    windowWidth,
    windowHeight,
  } = useResponsiveLayout({
    onBreakpointChange: (breakpoint) => {
      console.log(`Breakpoint changed to: ${breakpoint}`);
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
      <div>Orientation: {orientation}</div>
      <div>Window Size: {windowWidth}x{windowHeight}</div>
      {touchState.isTouching && (
        <div>
          Touch Direction: {touchState.direction || 'none'}
          Touch Distance: {touchState.distance}
        </div>
      )}
    </div>
  );
};
*/
