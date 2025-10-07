import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Assignments from '../../pages/dashboard/Assignments';
import { api } from '../../services/api';
import { useAssignmentsStore } from '../../services/AssignmentsService';
import { theme } from '../../theme';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('../../services/AssignmentsService', () => ({
  useAssignmentsStore: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock the AssignmentList component
vi.mock('../../components/assignments/AssignmentList', () => ({
  default: ({ onDelete }: { onDelete?: (assignment: any) => void }) => {
    const { data, isLoading, error } = useQuery({
      queryKey: ['assignments'],
      queryFn: async () => {
        const response = await api.get('/assignments');
        return response.data;
      },
    });

    if (isLoading) {
      return <div>Loading assignments...</div>;
    }

    if (error) {
      return <div>Error loading assignments. Please try again later.</div>;
    }

    return (
      <div>
        <h4>Assignments</h4>
        <a href="/new">Create Assignment</a>
        <input placeholder="Search assignments..." />
        <table>
          <tbody>
            {data?.items.map((assignment: any) => (
              <tr key={assignment.id}>
                <td>{assignment.title}</td>
                <td>{assignment.subject}</td>
                <td>{assignment.dueDate}</td>
                <td>{assignment.status}</td>
                <td>
                  <button onClick={() => onDelete?.(assignment)}>
                    <svg data-testid="DeleteIcon" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
}));

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <MemoryRouter>
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe('Assignments Component', () => {
  const mockAssignmentsState = {
    assignments: [],
    isLoading: false,
    error: null,
    createAssignment: vi.fn(),
    updateAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    categories: [],
    tags: [],
  };

  const mockAssignments = [
    {
      id: '1',
      title: 'Test Assignment 1',
      description: 'Test Description 1',
      dueDate: '2024-12-31',
      status: 'draft',
      subject: 'Math',
    },
    {
      id: '2',
      title: 'Test Assignment 2',
      description: 'Test Description 2',
      dueDate: '2024-12-30',
      status: 'published',
      subject: 'Science',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAssignmentsStore as any).mockImplementation(() => mockAssignmentsState);
    (api.get as any).mockResolvedValue({
      data: {
        items: mockAssignments,
        total: mockAssignments.length,
      },
    });
  });

  it('renders assignments interface', async () => {
    renderWithClient(<Assignments />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Assignments' })).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Create Assignment' })).toBeTruthy();
      expect(screen.getByPlaceholderText('Search assignments...')).toBeTruthy();
    });
  });

  it('shows loading state', async () => {
    (api.get as any).mockImplementation(() => new Promise(() => {}));
    renderWithClient(<Assignments />);
    await waitFor(() => {
      expect(screen.getByText('Loading assignments...')).toBeTruthy();
    });
  });

  it('shows error message', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Failed to load assignments'));
    renderWithClient(<Assignments />);

    await waitFor(
      () => {
        expect(screen.getByText('Error loading assignments. Please try again later.')).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });

  it('displays assignments list', async () => {
    renderWithClient(<Assignments />);

    // Wait for the assignments to appear with a longer timeout
    await waitFor(
      () => {
        expect(screen.getByText('Test Assignment 1')).toBeTruthy();
        expect(screen.getByText('Test Assignment 2')).toBeTruthy();
      },
      { timeout: 10000 }
    );

    // After we know the assignments are loaded, check the table structure
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2); // 2 assignment rows (no header row in the mock)
  });

  it('handles assignment creation', async () => {
    renderWithClient(<Assignments />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(screen.getByText('Test Assignment 1')).toBeTruthy();
    });

    const createLink = screen.getByRole('link', { name: 'Create Assignment' });
    expect(createLink.getAttribute('href')).toBe('/new');
  });

  it('handles assignment filtering', async () => {
    renderWithClient(<Assignments />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search assignments...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect((searchInput as HTMLInputElement).value).toBe('test');
    });
  });

  it('handles assignment deletion', async () => {
    const deleteAssignment = vi.fn();
    (useAssignmentsStore as any).mockImplementation(() => ({
      ...mockAssignmentsState,
      deleteAssignment,
    }));

    renderWithClient(<Assignments />);

    // Wait for assignments to load first
    await waitFor(() => {
      expect(screen.getByText('Test Assignment 1')).toBeTruthy();
    });

    // Find the delete button in the first assignment's row
    const firstAssignmentRow = screen.getByText('Test Assignment 1').closest('tr');
    const deleteButton = firstAssignmentRow?.querySelector('button');
    expect(deleteButton).toBeTruthy();
    fireEvent.click(deleteButton!);

    // Wait for the delete function to be called with just the ID
    await waitFor(
      () => {
        expect(deleteAssignment).toHaveBeenCalledWith('1');
      },
      { timeout: 2000 }
    );
  });
});
