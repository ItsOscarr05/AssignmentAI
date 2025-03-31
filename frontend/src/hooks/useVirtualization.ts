import { useCallback, useEffect, useRef, useState } from "react";
import { usePerformanceMonitoring } from "../utils/performance";

interface VirtualizationOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
  containerWidth?: number;
  horizontal?: boolean;
}

interface VirtualizationResult<T> {
  virtualItems: {
    index: number;
    item: T;
    start: number;
    end: number;
    size: number;
  }[];
  totalSize: number;
  startIndex: number;
  endIndex: number;
  scrollToIndex: (index: number) => void;
  scrollToOffset: (offset: number) => void;
  measure: () => void;
}

export const useVirtualization = <T>(
  items: T[],
  options: VirtualizationOptions
): VirtualizationResult<T> => {
  const {
    itemHeight,
    overscan = 3,
    containerHeight,
    containerWidth = 0,
    horizontal = false,
  } = options;

  const [scrollOffset, setScrollOffset] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Performance monitoring
  usePerformanceMonitoring("VirtualizedList");

  const calculateVisibleRange = useCallback(() => {
    const start = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const end = Math.min(items.length - 1, start + visibleItems);

    setStartIndex(start);
    setEndIndex(end);
  }, [scrollOffset, itemHeight, overscan, containerHeight, items.length]);

  useEffect(() => {
    calculateVisibleRange();
  }, [calculateVisibleRange]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const offset = index * itemHeight;
      setScrollOffset(offset);
      if (containerRef.current) {
        containerRef.current.scrollTop = offset;
      }
    },
    [itemHeight]
  );

  const scrollToOffset = useCallback((offset: number) => {
    setScrollOffset(offset);
    if (containerRef.current) {
      containerRef.current.scrollTop = offset;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newOffset = horizontal
        ? containerRef.current.scrollLeft
        : containerRef.current.scrollTop;
      setScrollOffset(newOffset);
    }
  }, [horizontal]);

  const measure = useCallback(() => {
    if (containerRef.current) {
      const newOffset = horizontal
        ? containerRef.current.scrollLeft
        : containerRef.current.scrollTop;
      setScrollOffset(newOffset);
    }
  }, [horizontal]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const virtualItems = items
    .slice(startIndex, endIndex + 1)
    .map((item, index) => ({
      index: startIndex + index,
      item,
      start: (startIndex + index) * itemHeight,
      end: (startIndex + index + 1) * itemHeight,
      size: itemHeight,
    }));

  const totalSize = items.length * itemHeight;

  return {
    virtualItems,
    totalSize,
    startIndex,
    endIndex,
    scrollToIndex,
    scrollToOffset,
    measure,
    containerRef,
  };
};

// Example usage:
/*
const VirtualizedList: React.FC<{ items: any[] }> = ({ items }) => {
  const {
    virtualItems,
    totalSize,
    containerRef,
    scrollToIndex,
  } = useVirtualization(items, {
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      style={{
        height: '400px',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map(({ item, start }) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: start,
              left: 0,
              right: 0,
              height: 50,
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
};
*/
