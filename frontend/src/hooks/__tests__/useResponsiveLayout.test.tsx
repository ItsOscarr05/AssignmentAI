import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useResponsiveLayout } from '../useResponsiveLayout';

// Mock the hooks used by useResponsiveLayout
vi.mock('../useErrorTracking', () => ({
  useErrorTracking: () => ({
    trackError: vi.fn(),
  }),
}));

vi.mock('../../utils/performance', () => ({
  usePerformanceMonitoring: () => ({
    measurePerformance: (_: string, fn: () => void) => fn(),
  }),
}));

describe('useResponsiveLayout', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset window dimensions before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    // Set window width to a small value to ensure 'xs' breakpoint
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Small mobile width
    });

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.currentBreakpoint).toBe('xs');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isLandscape).toBe(window.innerWidth > window.innerHeight);
  });

  it('should use custom breakpoints when provided', () => {
    const customBreakpoints = [
      { name: 'small', minWidth: 0, maxWidth: 767 },
      { name: 'medium', minWidth: 768, maxWidth: 1023 },
      { name: 'large', minWidth: 1024 },
    ];

    // Set window width to a value between small and medium
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useResponsiveLayout({ breakpoints: customBreakpoints }));

    expect(result.current.currentBreakpoint).toBe('small');
  });

  it('should update breakpoint on window resize', () => {
    // Set initial width to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useResponsiveLayout());

    // Initial state
    expect(result.current.currentBreakpoint).toBe('xs');

    // Simulate window resize to tablet size
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.currentBreakpoint).toBe('sm');
    expect(result.current.isTablet).toBe(true);
  });

  it('should handle touch events correctly', () => {
    const { result } = renderHook(() => useResponsiveLayout());

    // Create a mock touch event
    const touchEvent = new Event('touchstart') as TouchEvent;
    Object.defineProperty(touchEvent, 'touches', {
      value: [
        {
          clientX: 100,
          clientY: 100,
        },
      ],
    });

    // Simulate touch event
    act(() => {
      window.dispatchEvent(touchEvent);
    });

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('should update orientation on window resize', () => {
    const { result } = renderHook(() => useResponsiveLayout());

    // Set landscape orientation
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isLandscape).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useResponsiveLayout());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });

  it('should handle custom default breakpoint', () => {
    // Set window width to match the default breakpoint
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 960, // md breakpoint
    });

    const { result } = renderHook(() => useResponsiveLayout({ defaultBreakpoint: 'md' }));

    // Force a resize event to ensure the breakpoint is updated
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.currentBreakpoint).toBe('md');
    expect(result.current.isTablet).toBe(true);
  });

  it('should handle window dimensions correctly', () => {
    // Set initial width to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useResponsiveLayout());

    // Test different window sizes
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280, // lg breakpoint
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.currentBreakpoint).toBe('lg');
    expect(result.current.isDesktop).toBe(true);
  });
});
