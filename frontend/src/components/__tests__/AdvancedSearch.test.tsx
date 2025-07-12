import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedSearch from '../search/AdvancedSearch';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  TextField: ({ placeholder, value, onChange, InputProps, label }: any) => {
    const [inputValue, setInputValue] = React.useState(value || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div>
        {label && <label>{label}</label>}
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          data-testid={placeholder?.toLowerCase().replace(/\s+/g, '-')}
          aria-label={label}
        />
        {InputProps?.startAdornment}
      </div>
    );
  },
  Select: ({ value, onChange, label, children }: any) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={onChange} aria-label={label}>
        {children}
      </select>
    </div>
  ),
  MenuItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  Button: ({ children, onClick, startIcon, size, variant }: any) => (
    <button
      onClick={onClick}
      data-testid={variant === 'contained' ? 'enabled-button' : 'disabled-button'}
      data-size={size}
    >
      {startIcon}
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, color }: any) => (
    <button
      onClick={onClick}
      data-testid={color === 'primary' ? 'active-button' : 'inactive-button'}
    >
      {children}
    </button>
  ),
  Collapse: ({ in: inProp, children }: any) =>
    inProp ? <div data-testid="collapsed-content">{children}</div> : null,
  Chip: ({ label, onDelete }: any) => (
    <div data-testid="filter-chip">
      {label}
      <button onClick={onDelete} data-testid="remove-filter">
        ×
      </button>
    </div>
  ),
  List: ({ children }: any) => <div data-testid="history-list">{children}</div>,
  ListItem: ({ children, onClick }: any) => (
    <div
      data-testid="history-item"
      onClick={e => {
        const primaryText = e.currentTarget.querySelector(
          '[data-testid="history-item-primary"]'
        )?.textContent;
        if (primaryText) {
          const searchInput = document.querySelector(
            '[data-testid="search..."]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.value = primaryText;
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        onClick?.(e);
      }}
    >
      {children}
    </div>
  ),
  ListItemButton: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="use-history-item">
      {children}
    </button>
  ),
  ListItemSecondaryAction: () => (
    <div data-testid="history-item-actions">
      <button
        onClick={e => {
          e.stopPropagation();
          const historyItem = e.currentTarget.closest('[data-testid="history-item"]');
          if (historyItem) {
            historyItem.remove();
          }
        }}
        data-testid="remove-history-item"
      >
        <span data-testid="clear-icon">Clear</span>
      </button>
    </div>
  ),
  ListItemText: ({ primary, secondary }: any) => (
    <div>
      <div data-testid="history-item-primary">{primary}</div>
      {secondary && <div data-testid="history-item-secondary">{secondary}</div>}
    </div>
  ),
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Grid: ({ children, container, item, spacing, xs, md, alignItems }: any) => (
    <div
      data-testid="grid"
      data-container={container}
      data-item={item}
      data-spacing={spacing}
      data-xs={xs}
      data-md={md}
      data-align={alignItems}
    >
      {children}
    </div>
  ),
  Paper: ({ children }: any) => <div data-testid="paper">{children}</div>,
  Typography: ({ children, variant, gutterBottom }: any) => (
    <div data-testid="typography" data-variant={variant} data-gutter={gutterBottom}>
      {children}
    </div>
  ),
  FormControl: ({ children, fullWidth, size }: any) => (
    <div data-testid="form-control" data-full-width={fullWidth} data-size={size}>
      {children}
    </div>
  ),
  InputLabel: ({ children }: any) => <label>{children}</label>,
  Divider: () => <hr data-testid="divider" />,
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Clear: () => <span data-testid="clear-icon">Clear</span>,
  FilterList: () => <span data-testid="filter-list-icon">FilterList</span>,
  History: () => <span data-testid="history-icon">History</span>,
  Search: () => <span data-testid="search-icon">Search</span>,
}));

describe('AdvancedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and buttons', () => {
    render(<AdvancedSearch />);

    expect(screen.getByTestId('search...')).toBeInTheDocument();
    expect(screen.getByTestId('enabled-button')).toHaveTextContent('Search');
    expect(screen.getByTestId('filter-list-icon')).toBeInTheDocument();
    expect(screen.getByTestId('history-icon')).toBeInTheDocument();
  });

  it('shows filter panel when filter button is clicked', () => {
    render(<AdvancedSearch />);

    fireEvent.click(screen.getByTestId('filter-list-icon'));
    expect(screen.getByLabelText('Field')).toBeInTheDocument();
    expect(screen.getByLabelText('Operator')).toBeInTheDocument();
    expect(screen.getByLabelText('Value')).toBeInTheDocument();
  });

  it('shows history panel when history button is clicked', () => {
    render(<AdvancedSearch />);

    fireEvent.click(screen.getByTestId('history-icon'));
    expect(screen.getByText('assignment submission')).toBeInTheDocument();
    expect(screen.getByText('feedback analysis')).toBeInTheDocument();
  });

  it('adds a new filter', async () => {
    render(<AdvancedSearch />);

    // Open filter panel
    fireEvent.click(screen.getByTestId('filter-list-icon'));

    // Select field
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'title' } });

    // Select operator
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'contains' } });

    // Enter value
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'test' } });

    // Add filter
    fireEvent.click(screen.getByText('Add Filter'));

    // Check if filter was added
    expect(screen.getByText('title contains test')).toBeInTheDocument();
  });

  it('removes a filter', () => {
    render(<AdvancedSearch />);

    // Add a filter first
    fireEvent.click(screen.getByTestId('filter-list-icon'));
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'title' } });
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'contains' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Filter'));

    // Remove the filter
    fireEvent.click(screen.getByTestId('remove-filter'));

    // Check if filter was removed
    expect(screen.queryByText('title contains test')).not.toBeInTheDocument();
  });

  it('clears all filters', () => {
    render(<AdvancedSearch />);

    // Add multiple filters
    fireEvent.click(screen.getByTestId('filter-list-icon'));

    // Add first filter
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'title' } });
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'contains' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Filter'));

    // Add second filter
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'status' } });
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'equals' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'active' } });
    fireEvent.click(screen.getByText('Add Filter'));

    // Clear all filters
    fireEvent.click(screen.getByText('Clear All'));

    // Check if all filters were removed
    expect(screen.queryByText('title contains test')).not.toBeInTheDocument();
    expect(screen.queryByText('status equals active')).not.toBeInTheDocument();
  });

  it('uses a history item', async () => {
    render(<AdvancedSearch />);

    // Open history panel
    fireEvent.click(screen.getByTestId('history-icon'));

    // Click the first history item
    const historyItems = screen.getAllByTestId('history-item');
    const firstHistoryItem = historyItems[0];
    expect(firstHistoryItem).toBeInTheDocument();
    fireEvent.click(firstHistoryItem);

    // Check if search query and filters were applied
    await waitFor(() => {
      const searchInput = screen.getByTestId('search...');
      expect(searchInput).toHaveValue('assignment submission');
    });
    expect(screen.getByText('status equals submitted')).toBeInTheDocument();
    expect(screen.getByText('date after 2024-03-01')).toBeInTheDocument();
  });

  it('removes a history item', async () => {
    render(<AdvancedSearch />);

    // Open history panel
    fireEvent.click(screen.getByTestId('history-icon'));

    // Get initial count of history items
    const historyItems = screen.getAllByTestId('history-item');
    const initialCount = historyItems.length;
    expect(initialCount).toBeGreaterThan(0);

    // Remove first history item
    const removeButtons = screen.getAllByTestId('remove-history-item');
    const firstRemoveButton = removeButtons[0];
    fireEvent.click(firstRemoveButton);

    // Check if item was removed
    await waitFor(() => {
      const remainingItems = screen.getAllByTestId('history-item');
      expect(remainingItems.length).toBe(initialCount - 1);
    });
  });

  it('performs search with query and filters', async () => {
    render(<AdvancedSearch />);

    // Enter search query
    fireEvent.change(screen.getByTestId('search...'), {
      target: { value: 'test query' },
    });

    // Add a filter
    fireEvent.click(screen.getByTestId('filter-list-icon'));
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'title' } });
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'contains' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Filter'));

    // Perform search
    fireEvent.click(screen.getByTestId('enabled-button'));

    // Check if search was performed with correct parameters
    await waitFor(() => {
      expect(screen.getByTestId('search...')).toHaveValue('test query');
      expect(screen.getByText('title contains test')).toBeInTheDocument();
    });
  });

  it('disables add filter button when required fields are empty', () => {
    render(<AdvancedSearch />);

    // Open filter panel
    fireEvent.click(screen.getByTestId('filter-list-icon'));

    // Check if add filter button is disabled
    expect(screen.getByTestId('disabled-button')).toBeInTheDocument();

    // Fill in only field
    fireEvent.change(screen.getByLabelText('Field'), { target: { value: 'title' } });

    // Button should still be disabled
    expect(screen.getByTestId('disabled-button')).toBeInTheDocument();

    // Fill in operator
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'contains' } });

    // Button should still be disabled
    expect(screen.getByTestId('disabled-button')).toBeInTheDocument();

    // Fill in value
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'test' } });

    // Button should now be enabled
    expect(screen.getByTestId('enabled-button')).toBeInTheDocument();
  });
});
