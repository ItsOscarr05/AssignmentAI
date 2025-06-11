import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import React, { useEffect } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const PaginationComponent: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}) => {
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    onPageSizeChange(event.target.value as number);
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Clamp page to [1, totalPages]
  const clampedPage = Math.max(1, Math.min(page, totalPages));

  useEffect(() => {
    // Fix MUI's aria-current="true" to aria-current="page" for accessibility and test compatibility
    const currentBtn = document.querySelector('button[aria-current="true"]');
    if (currentBtn) {
      currentBtn.setAttribute('aria-current', 'page');
    }
  });

  if (totalItems === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <Typography variant="body2" color="textSecondary">
          No items
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color="textSecondary">
          Showing {startItem}-{endItem} of {totalItems} items
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="pagination-page-size-label">Items per page</InputLabel>
          <Select
            labelId="pagination-page-size-label"
            id="pagination-page-size"
            value={pageSize}
            label="Items per page"
            onChange={handlePageSizeChange}
          >
            {pageSizeOptions.map(size => (
              <MenuItem key={size} value={size}>
                {size} per page
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Only render Pagination if more than one page */}
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={clampedPage}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
          size="large"
          aria-label="pagination"
        />
      )}
    </Box>
  );
};
