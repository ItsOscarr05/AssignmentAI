import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Search } from '../common/Search';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    TextField: ({
      label,
      placeholder,
      value,
      onChange,
      error,
      helperText,
      size,
      color,
      variant,
      className,
      style,
      InputProps,
      ...props
    }: any) => (
      <div>
        {label && <label htmlFor="search-input">{label}</label>}
        <div>
          <input
            data-testid="text-field"
            id="search-input"
            role="searchbox"
            type="search"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={InputProps?.inputProps?.className || ''}
            style={InputProps?.inputProps?.style || {}}
            aria-invalid={error}
            aria-describedby={error ? 'search-error' : undefined}
            {...InputProps?.inputProps}
            {...props}
          />
          {InputProps?.startAdornment}
          {InputProps?.endAdornment}
        </div>
        {error && (
          <p id="search-error" data-testid="form-helper-text">
            {helperText}
          </p>
        )}
      </div>
    ),
    InputAdornment: ({ children, position, ...props }: any) => (
      <div data-testid="input-adornment" data-position={position} {...props}>
        {children}
      </div>
    ),
    IconButton: ({
      onClick,
      children,
      'aria-label': ariaLabel,
      className,
      style,
      ...props
    }: any) => (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </button>
    ),
    CircularProgress: ({ size, ...props }: any) => (
      <div data-testid="circular-progress" role="progressbar" size={size} {...props} />
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Search: ({ className, style }: any) => (
    <span data-testid="SearchIcon" className={className} style={style}>
      🔍
    </span>
  ),
  Clear: () => <span data-testid="ClearIcon">✕</span>,
}));

describe('Search', () => {
  const defaultProps = {
    onSearch: vi.fn().mockImplementation(() => Promise.resolve([])),
    placeholder: 'Search...',
    debounceMs: 300,
    minLength: 2,
    maxLength: 50,
  };

  const renderSearch = (props = {}) => {
    // Clear localStorage before each render
    localStorage.clear();
    return render(<Search {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderSearch();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      renderSearch({ placeholder: 'Custom placeholder' });
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders with custom size', () => {
      renderSearch({ size: 'lg' });
      const input = screen.getByTestId('text-field');
      expect(input.className).toContain('text-lg');
    });

    it('renders with custom color', () => {
      renderSearch({ color: 'warning' });
      const input = screen.getByTestId('text-field');
      expect(input.className).toContain('text-warning');
    });

    it('renders with custom variant', () => {
      renderSearch({ variant: 'outlined' });
      const input = screen.getByTestId('text-field');
      expect(input.className).toContain('border');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('handles search input', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox');

      // Trigger input change
      fireEvent.change(input, { target: { value: 'test' } });

      // Advance timers to trigger debounce
      await vi.advanceTimersByTimeAsync(300);

      // Verify search was called
      expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
    });

    it('handles search with debounce', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox');

      // First change
      fireEvent.change(input, { target: { value: 'test' } });
      expect(defaultProps.onSearch).not.toHaveBeenCalled();

      // Advance timers to trigger debounce
      await vi.advanceTimersByTimeAsync(300);

      // Verify search was called
      expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
    });

    it('handles search with minimum length', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox');

      // Test below minimum length
      fireEvent.change(input, { target: { value: 'a' } });
      await vi.advanceTimersByTimeAsync(300);
      expect(defaultProps.onSearch).not.toHaveBeenCalled();

      // Test at minimum length
      fireEvent.change(input, { target: { value: 'ab' } });
      await vi.advanceTimersByTimeAsync(300);
      expect(defaultProps.onSearch).toHaveBeenCalledWith('ab');
    });

    it('handles search with maximum length', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const longInput = 'a'.repeat(51);

      // Test above maximum length
      fireEvent.change(input, { target: { value: longInput } });
      await vi.advanceTimersByTimeAsync(300);
      expect(input.value).toBe('a'.repeat(50));
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSearch();
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper label', () => {
      renderSearch({ label: 'Custom Label' });
      const input = screen.getByLabelText('Custom Label');
      expect(input).toBeInTheDocument();
      expect(input.tagName.toLowerCase()).toBe('input');
    });

    it('has proper error message', () => {
      renderSearch({ error: 'Invalid search' });
      const error = screen.getByText('Invalid search');
      expect(error).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      renderSearch({
        className: 'custom-class',
      });
      const input = screen.getByTestId('text-field');
      expect(input.className).toContain('custom-class');
    });

    it('applies custom style', () => {
      renderSearch({
        style: { backgroundColor: 'red' },
      });
      const input = screen.getByTestId('text-field');
      expect(input.style.backgroundColor).toBe('red');
    });

    it('applies custom icon className', () => {
      renderSearch({
        iconClassName: 'custom-icon-class',
      });
      const icon = screen.getByTestId('SearchIcon');
      expect(icon.className).toContain('custom-icon-class');
    });

    it('applies custom icon style', () => {
      renderSearch({
        iconStyle: { color: 'blue' },
      });
      const icon = screen.getByTestId('SearchIcon');
      expect(icon.style.color).toBe('blue');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('handles empty search', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox');

      // Test empty input
      fireEvent.change(input, { target: { value: '' } });
      await vi.advanceTimersByTimeAsync(300);

      // Empty searches should not trigger the search callback
      expect(defaultProps.onSearch).not.toHaveBeenCalled();

      // Results should be cleared
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('handles special characters', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox');

      // Test special characters
      fireEvent.change(input, { target: { value: 'test@#$%' } });
      await vi.advanceTimersByTimeAsync(300);
      expect(defaultProps.onSearch).toHaveBeenCalledWith('test@#$%');
    });

    it('handles long input', async () => {
      renderSearch();
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const longInput = 'a'.repeat(100);

      // Test very long input
      fireEvent.change(input, { target: { value: longInput } });
      await vi.advanceTimersByTimeAsync(300);
      expect(input.value).toBe('a'.repeat(50));
    });

    it('handles disabled state', () => {
      renderSearch({ disabled: true });
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('disabled');
    });

    it('handles loading state', () => {
      renderSearch({ loading: true });
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('disabled');
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
