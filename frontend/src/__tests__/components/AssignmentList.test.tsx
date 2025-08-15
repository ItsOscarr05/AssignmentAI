import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import AssignmentList from '../assignments/AssignmentList';

// Mock data
const mockAssignments = [
  {
    id: 1,
    title: 'Test 1',
    subject: 'Math',
    grade_level: '10',
    dueDate: '2024-12-31T00:00:00.000Z',
    status: 'Active',
  },
];

// Mock useQuery to return data immediately
vi.mock('@tanstack/react-query', async importOriginal => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useQuery: vi.fn(() => ({ data: { items: mockAssignments }, isLoading: false, error: null })),
  });
});

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Dialog: ({ children, ...props }: any) => (
      <div role="dialog" {...props}>
        {children}
      </div>
    ),
    DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    DialogActions: ({ children, ...props }: any) => (
      <div role="group" {...props}>
        {children}
      </div>
    ),
    List: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    ListItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    ListItemIcon: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ListItemText: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Divider: (props: any) => <hr {...props} />,
    Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CircularProgress: (props: any) => <div role="progressbar" {...props} />,
    CssBaseline: () => null,
    // Add table-related components
    TableContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
    TableHead: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
    TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
    TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    TableCell: ({ children, ...props }: any) => {
      // Use th for header cells with columnheader role, td for body cells
      const Component = props.variant === 'head' ? 'th' : 'td';
      const role = props.variant === 'head' ? 'columnheader' : undefined;
      return (
        <Component role={role} {...props}>
          {children}
        </Component>
      );
    },
    TablePagination: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    TableSortLabel: ({ children, ...props }: any) => (
      <span role="button" {...props}>
        {children}
      </span>
    ),
  };
});

describe('AssignmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAssignmentList = () => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MemoryRouter>
            <AssignmentList />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it('renders the list with all required elements', () => {
    renderAssignmentList();

    // First verify we can find the table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Then verify we can find the headers
    const tableHeaders = within(table).getAllByRole('columnheader');
    expect(tableHeaders.length).toBeGreaterThan(0);

    // Check each header individually
    const headerTexts = tableHeaders.map(header => header.textContent?.toLowerCase().trim() || '');

    // Verify all required headers are present
    expect(headerTexts).toContain('title');
    expect(headerTexts).toContain('subject');
    expect(headerTexts).toContain('due date');
    expect(headerTexts).toContain('status');

    // Verify the mock data is displayed
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
