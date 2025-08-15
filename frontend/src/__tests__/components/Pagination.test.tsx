import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaginationComponent } from '../common/Pagination';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Stack: ({ children, direction, spacing, alignItems, ...props }: any) => (
      <div
        {...props}
        style={{
          display: 'flex',
          flexDirection: direction === 'row' ? 'row' : 'column',
          gap: spacing * 8, // Convert spacing to pixels (MUI uses 8px as base)
          alignItems,
        }}
      >
        {children}
      </div>
    ),
    Typography: ({ children, variant, color, ...props }: any) => (
      <p {...props} data-variant={variant} data-color={color}>
        {children}
      </p>
    ),
    FormControl: ({ children, size, ...props }: any) => (
      <div {...props} data-size={size}>
        {children}
      </div>
    ),
    InputLabel: ({ children, id, ...props }: any) => (
      <label htmlFor={id} {...props}>
        {children}
      </label>
    ),
    Select: ({ children, value, onChange, label, ...props }: any) => (
      <select
        value={value}
        onChange={e => onChange({ target: { value: Number(e.target.value) } })}
        aria-label={label}
        {...props}
      >
        {children}
      </select>
    ),
    MenuItem: ({ children, value, ...props }: any) => (
      <option value={value} {...props}>
        {children}
      </option>
    ),
    Pagination: ({
      count,
      page,
      onChange,
      color,
      showFirstButton,
      showLastButton,
      size,
      'aria-label': ariaLabel,
      ...props
    }: any) => (
      <nav aria-label={ariaLabel} {...props}>
        <div>
          {showFirstButton && (
            <button
              onClick={() => onChange({}, 1)}
              disabled={page === 1}
              aria-label="Go to first page"
            >
              First
            </button>
          )}
          <button
            onClick={() => onChange({}, page - 1)}
            disabled={page === 1}
            aria-label="Go to previous page"
          >
            Previous
          </button>
          {Array.from({ length: count }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => onChange({}, pageNum)}
              aria-current={pageNum === page ? 'page' : undefined}
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => onChange({}, page + 1)}
            disabled={page === count}
            aria-label="Go to next page"
          >
            Next
          </button>
          {showLastButton && (
            <button
              onClick={() => onChange({}, count)}
              disabled={page === count}
              aria-label="Go to last page"
            >
              Last
            </button>
          )}
        </div>
      </nav>
    ),
  };
});

describe('PaginationComponent', () => {
  const defaultProps = {
    page: 1,
    totalPages: 5,
    totalItems: 50,
    pageSize: 10,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  const renderPagination = (props = {}) => {
    return render(<PaginationComponent {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderPagination();
      expect(screen.getByText(/Showing 1-10 of 50 items/)).toBeInTheDocument();
      expect(screen.getByLabelText('Items per page')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'pagination' })).toBeInTheDocument();
    });

    it('renders page size selector', () => {
      renderPagination();
      const select = screen.getByLabelText('Items per page');
      expect(select).toHaveValue('10');
      expect(screen.getByText('10 per page')).toBeInTheDocument();
      expect(screen.getByText('25 per page')).toBeInTheDocument();
      expect(screen.getByText('50 per page')).toBeInTheDocument();
      expect(screen.getByText('100 per page')).toBeInTheDocument();
    });

    it('displays current page and total items', () => {
      renderPagination({ page: 2 });
      expect(screen.getByText(/Showing 11-20 of 50 items/)).toBeInTheDocument();
    });
  });

  describe('Page Navigation', () => {
    it('handles page change', () => {
      renderPagination();
      fireEvent.click(screen.getByLabelText('Go to page 2'));
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('handles page size change', () => {
      renderPagination();
      fireEvent.change(screen.getByLabelText('Items per page'), { target: { value: '25' } });
      expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(25);
    });

    it('disables previous button on first page', () => {
      renderPagination({ page: 1 });
      expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    });

    it('disables next button on last page', () => {
      renderPagination({ page: 5 });
      expect(screen.getByLabelText('Go to next page')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderPagination();
      expect(screen.getByRole('navigation', { name: 'pagination' })).toBeInTheDocument();
      expect(screen.getByLabelText('Items per page')).toBeInTheDocument();
    });

    it('indicates current page', () => {
      renderPagination({ page: 2 });
      expect(screen.getByLabelText('Go to page 2')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Edge Cases', () => {
    it('handles single page', () => {
      renderPagination({ totalPages: 1, totalItems: 5 });
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('handles no items', () => {
      renderPagination({ totalItems: 0 });
      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('handles invalid page number', () => {
      renderPagination({ page: 10 }); // Page 10 doesn't exist
      expect(screen.getByText(/Showing 91-50 of 50 items/)).toBeInTheDocument();
    });
  });
});
