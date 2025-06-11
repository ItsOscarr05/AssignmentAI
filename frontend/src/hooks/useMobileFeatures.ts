import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerformanceMonitoring } from '../utils/performance';
import { useErrorTracking } from './useErrorTracking';

interface GestureOptions {
  threshold: number;
  velocity: number;
  preventDefault: boolean;
  onGesture?: (gesture: string) => void;
}

interface MobileFeaturesOptions {
  enablePullToRefresh?: boolean;
  enableSwipeNavigation?: boolean;
  enablePinchZoom?: boolean;
  enableDoubleTap?: boolean;
  enableLongPress?: boolean;
  gestureOptions?: Partial<GestureOptions>;
}

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  velocity: number;
  scale: number;
  rotation: number;
  isActive: boolean;
}

export const useMobileFeatures = (options: MobileFeaturesOptions = {}) => {
  const {
    enablePullToRefresh = true,
    enableSwipeNavigation = true,
    enablePinchZoom = true,
    enableDoubleTap = true,
    enableLongPress = true,
    gestureOptions: userGestureOptions = {},
  } = options;

  const gestureOptions: GestureOptions = {
    threshold: 50,
    velocity: 0.5,
    preventDefault: true,
    onGesture: undefined,
    ...userGestureOptions,
  };

  useErrorTracking();
  usePerformanceMonitoring('MobileFeatures');

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [scale, setScale] = useState(1);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const gestureState = useRef<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    velocity: 0,
    scale: 1,
    rotation: 0,
    isActive: false,
  });

  const longPressTimeout = useRef<NodeJS.Timeout>();
  const pullThreshold = useRef(100);

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0];
      gestureState.current = {
        ...gestureState.current,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: Date.now(),
        isActive: true,
      };

      // Handle long press
      if (enableLongPress) {
        longPressTimeout.current = setTimeout(() => {
          setIsLongPressing(true);
          gestureOptions.onGesture?.('longPress');
        }, 500);
      }

      // Handle double tap
      if (enableDoubleTap) {
        const currentTime = Date.now();
        if (currentTime - lastTapTime < 300) {
          setScale(prev => (prev === 1 ? 1.5 : 1));
          gestureOptions.onGesture?.('doubleTap');
        }
        setLastTapTime(currentTime);
      }
    },
    [enableLongPress, enableDoubleTap, lastTapTime, gestureOptions]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!gestureState.current.isActive) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - gestureState.current.startX;
      const deltaY = touch.clientY - gestureState.current.startY;
      const deltaTime = Date.now() - gestureState.current.startTime;

      gestureState.current = {
        ...gestureState.current,
        currentX: touch.clientX,
        currentY: touch.clientY,
        velocity: Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime,
      };

      // Handle pull to refresh
      if (enablePullToRefresh && window.scrollY === 0 && deltaY > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(deltaY, pullThreshold.current));
        if (gestureOptions.preventDefault) {
          event.preventDefault();
        }
      }

      // Handle swipe navigation
      if (enableSwipeNavigation) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > gestureOptions.threshold) {
            gestureOptions.onGesture?.('swipeRight');
          } else if (deltaX < -gestureOptions.threshold) {
            gestureOptions.onGesture?.('swipeLeft');
          }
        }
      }

      // Handle pinch zoom
      if (enablePinchZoom && event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const initialDistance = Math.hypot(
          gestureState.current.startX - touch1.clientX,
          gestureState.current.startY - touch1.clientY
        );
        const newScale = (distance / initialDistance) * gestureState.current.scale;
        setScale(Math.min(Math.max(newScale, 0.5), 3));
        setIsZooming(true);
      }
    },
    [enablePullToRefresh, enableSwipeNavigation, enablePinchZoom, gestureOptions]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!gestureState.current.isActive) return;

    // Clear long press timeout
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = undefined;
    }

    // Handle pull to refresh
    if (isPulling && pullDistance >= pullThreshold.current) {
      setIsRefreshing(true);
      gestureOptions.onGesture?.('pullToRefresh');
      // Simulate refresh completion
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }

    setIsPulling(false);
    setIsLongPressing(false);
    setIsZooming(false);
    gestureState.current.isActive = false;
  }, [isPulling, pullDistance, gestureOptions]);

  // Add event listeners
  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle device orientation
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return {
    // Pull to refresh
    isPulling,
    pullDistance,
    isRefreshing,
    refresh: () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    },

    // Gestures
    isLongPressing,
    scale,
    isZooming,
    orientation,

    // Gesture state
    gestureState: gestureState.current,
  };
};

// Example usage:
/*
const MobileComponent: React.FC = () => {
  const {
    isPulling,
    pullDistance,
    isRefreshing,
    isLongPressing,
    scale,
    isZooming,
    orientation,
  } = useMobileFeatures({
    enablePullToRefresh: true,
    enableSwipeNavigation: true,
    enablePinchZoom: true,
    enableDoubleTap: true,
    enableLongPress: true,
    gestureOptions: {
      threshold: 50,
      velocity: 0.5,
      preventDefault: true,
      onGesture: (gesture) => {
        console.log(`Gesture detected: ${gesture}`);
      },
    },
  });

  return (
    <div>
      <h2>Mobile Features Demo</h2>
      <div>Pull Distance: {pullDistance}</div>
      <div>Refreshing: {isRefreshing ? 'Yes' : 'No'}</div>
      <div>Long Press: {isLongPressing ? 'Yes' : 'No'}</div>
      <div>Scale: {scale}</div>
      <div>Zooming: {isZooming ? 'Yes' : 'No'}</div>
      <div>Orientation: {orientation}</div>
    </div>
  );
};
*/
