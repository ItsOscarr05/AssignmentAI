import { useGesture } from "@use-gesture/react";
import React, { useEffect, useRef, useState } from "react";
import { useBreakpoints } from "../hooks/useMediaQuery";

interface MobileListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const MobileList = <T extends unknown>({
  items,
  renderItem,
  onRefresh,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  emptyMessage = "No items found",
  className = "",
}: MobileListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useBreakpoints();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Pull to refresh gesture
  const bind = useGesture({
    onDrag: ({ movement: [_, my], direction: [_, dy], cancel }) => {
      if (!onRefresh || !isMobile) return;

      if (dy < 0 && containerRef.current?.scrollTop === 0) {
        setPullDistance(Math.min(my * 0.5, 100));
      } else {
        cancel();
      }
    },
    onDragEnd: async ({ velocity: [_, vy] }) => {
      if (!onRefresh || !isMobile) return;

      if (pullDistance > 50 && vy > 0.5) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    },
  });

  // Infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || !hasMore || isLoading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, hasMore, isLoading]);

  return (
    <div
      ref={containerRef}
      className={`mobile-list ${className}`}
      {...bind()}
      style={{
        transform: `translateY(${pullDistance}px)`,
      }}
    >
      {isRefreshing && (
        <div className="refresh-indicator">
          <div className="spinner" />
          <span>Refreshing...</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {items.map((item, index) => (
            <div key={index} className="list-item">
              {renderItem(item)}
            </div>
          ))}

          {isLoading && hasMore && (
            <div className="loading-indicator">
              <div className="spinner" />
              <span>Loading more...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
