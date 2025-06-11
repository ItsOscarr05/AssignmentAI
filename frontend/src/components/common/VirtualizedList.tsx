import { Box, BoxProps } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useThrottledCallback } from '../../utils/performance';

interface VirtualizedListProps<T> extends Omit<BoxProps, 'onScroll'> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscanCount?: number;
  onScroll?: (scrollTop: number) => void;
}

const VirtualizedList = <T,>({
  items,
  itemHeight,
  renderItem,
  overscanCount = 3,
  onScroll,
  ...props
}: VirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const handleScroll = useThrottledCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    16,
    [onScroll]
  );

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscanCount
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        overflow: 'auto',
        height: '100%',
        position: 'relative',
        ...props.sx,
      }}
      {...props}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map((item, index) => (
          <Box
            key={startIndex + index}
            sx={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, startIndex + index)}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default VirtualizedList;
