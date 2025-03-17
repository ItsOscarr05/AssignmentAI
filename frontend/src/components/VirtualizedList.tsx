import React from 'react';
import { List, AutoSizer, ListRowProps } from 'react-virtualized';
import { Box, useTheme } from '@mui/material';

interface VirtualizedListProps<T> {
  items: T[];
  rowHeight: number;
  renderItem: (item: T, style: React.CSSProperties) => React.ReactNode;
  height?: number;
  width?: number;
  overscanRowCount?: number;
}

function VirtualizedList<T>({
  items,
  rowHeight,
  renderItem,
  height = 400,
  width = '100%',
  overscanRowCount = 10,
}: VirtualizedListProps<T>): React.ReactElement {
  const theme = useTheme();

  const rowRenderer = ({ index, style, key }: ListRowProps) => {
    const item = items[index];
    return (
      <div key={key} style={style}>
        {renderItem(item, style)}
      </div>
    );
  };

  return (
    <Box
      sx={{
        height,
        width,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <AutoSizer>
        {({ width, height }) => (
          <List
            width={width}
            height={height}
            rowCount={items.length}
            rowHeight={rowHeight}
            rowRenderer={rowRenderer}
            overscanRowCount={overscanRowCount}
          />
        )}
      </AutoSizer>
    </Box>
  );
}

export default VirtualizedList; 