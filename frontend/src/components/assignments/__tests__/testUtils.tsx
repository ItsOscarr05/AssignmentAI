import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    TableSortLabel: ({ children, ...props }: any) => (
      <button {...props} data-testid="table-sort-label">
        {children}
      </button>
    ),
    TableCell: ({ children, ...props }: any) => (
      <td {...props} data-testid="table-cell">
        {children}
      </td>
    ),
    TableRow: ({ children, ...props }: any) => (
      <tr {...props} data-testid="table-row">
        {children}
      </tr>
    ),
    TableHead: ({ children, ...props }: any) => (
      <thead {...props} data-testid="table-head">
        {children}
      </thead>
    ),
    TableBody: ({ children, ...props }: any) => (
      <tbody {...props} data-testid="table-body">
        {children}
      </tbody>
    ),
    Table: ({ children, ...props }: any) => (
      <table {...props} data-testid="table">
        {children}
      </table>
    ),
    TableContainer: ({ children, ...props }: any) => (
      <div {...props} data-testid="table-container">
        {children}
      </div>
    ),
    TablePagination: ({ onPageChange, onRowsPerPageChange, ...props }: any) => (
      <div data-testid="table-pagination">
        <button onClick={() => onPageChange({}, 1)}>Next Page</button>
        <button onClick={() => onPageChange({}, 0)}>Previous Page</button>
        <select
          onChange={e => onRowsPerPageChange({ target: { value: e.target.value } })}
          data-testid="rows-per-page"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>
      </div>
    ),
    TextField: ({ label, error, helperText, onChange, ...props }: any) => (
      <div>
        <input
          {...props}
          onChange={e => onChange && onChange(e)}
          data-testid="text-field"
          label={label}
          helpertext={helperText}
        />
        {error && <p data-testid="undefined-error">{helperText}</p>}
      </div>
    ),
    FormControl: ({ children, error, label, ...props }: any) => (
      <div data-testid="form-control">
        <label data-testid="input-label">{label}</label>
        {children}
        {error && <p data-testid="form-helper-text">{props.helperText}</p>}
      </div>
    ),
    FormHelperText: ({ children, ...props }: any) => (
      <p {...props} data-testid="form-helper-text">
        {children}
      </p>
    ),
    InputLabel: ({ children, ...props }: any) => (
      <label {...props} data-testid="input-label">
        {children}
      </label>
    ),
    Select: ({ children, onChange, value, ...props }: any) => (
      <select {...props} value={value} onChange={e => onChange && onChange(e)} data-testid="select">
        {children}
      </select>
    ),
    MenuItem: ({ children, value, ...props }: any) => (
      <option {...props} value={value} data-testid="menu-item">
        {children}
      </option>
    ),
    Chip: ({ label, onClick, ...props }: any) => (
      <button onClick={onClick} data-testid="chip">
        {label}
      </button>
    ),
    IconButton: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} data-testid="icon-button">
        {children}
      </button>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} data-testid="button">
        {children}
      </button>
    ),
    Paper: ({ children, ...props }: any) => (
      <div {...props} data-testid="paper">
        {children}
      </div>
    ),
    Typography: ({ children, ...props }: any) => (
      <p {...props} data-testid="typography">
        {children}
      </p>
    ),
    Box: ({ children, ...props }: any) => (
      <div {...props} data-testid="box">
        {children}
      </div>
    ),
  };
});

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Delete: () => <span data-testid="delete-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Search: () => <span data-testid="search-icon" />,
  Add: () => <span data-testid="add-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
}));

// Mock data
export const mockAssignments = [
  {
    id: '1',
    title: 'Mathematics Assignment',
    subject: 'Mathematics',
    description: 'Solve calculus problems',
    due_date: '2024-03-01T00:00:00.000Z',
    status: 'draft',
    created_at: '2024-02-01T00:00:00.000Z',
    updated_at: '2024-02-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Physics Lab Report',
    subject: 'Physics',
    description: 'Write a lab report on mechanics',
    due_date: '2024-03-15T00:00:00.000Z',
    status: 'published',
    created_at: '2024-02-01T00:00:00.000Z',
    updated_at: '2024-02-01T00:00:00.000Z',
  },
];

// Create a new QueryClient for each test
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Render with router
export const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock fetch responses
export const mockFetchResponses = {
  success: {
    ok: true,
    json: () => Promise.resolve({ items: mockAssignments, total: mockAssignments.length }),
  },
  error: {
    ok: false,
    json: () => Promise.reject(new Error('Failed to fetch')),
  },
  empty: {
    ok: true,
    json: () => Promise.resolve({ items: [], total: 0 }),
  },
};

// Setup test environment
export const setupTest = () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  return {
    mockFetch,
    renderWithRouter,
    mockFetchResponses,
  };
};
