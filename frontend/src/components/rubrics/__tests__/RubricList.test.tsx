import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { theme } from '../../../theme';
import RubricList from '../RubricList';

// Mock the API module
vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockRubrics = [
  {
    id: '1',
    title: 'Programming Assignment Rubric',
    description: 'Evaluation criteria for programming assignments',
    assignment_title: 'Assignment 1',
    total_score: 100,
    passing_score: 60,
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T11:00:00Z',
    criteria: [
      {
        id: '1',
        name: 'Code Quality',
        description: 'Code organization and readability',
        max_score: 30,
        weight: 0.3,
      },
      {
        id: '2',
        name: 'Functionality',
        description: 'Program works as expected',
        max_score: 40,
        weight: 0.4,
      },
    ],
  },
  {
    id: '2',
    title: 'Essay Writing Rubric',
    description: 'Evaluation criteria for essays',
    assignment_title: 'Assignment 2',
    total_score: 50,
    passing_score: 30,
    created_at: '2024-03-14T15:30:00Z',
    updated_at: '2024-03-14T16:30:00Z',
    criteria: [
      {
        id: '3',
        name: 'Content',
        description: 'Quality and relevance of content',
        max_score: 25,
        weight: 0.5,
      },
      {
        id: '4',
        name: 'Structure',
        description: 'Essay organization and flow',
        max_score: 25,
        weight: 0.5,
      },
    ],
  },
];

const renderRubricList = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RubricList />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('RubricList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as any).mockImplementationOnce(() => new Promise(() => {}));
    renderRubricList();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders rubrics successfully', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 2 },
    });
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
      expect(screen.getByText('Essay Writing Rubric')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Failed to fetch'));
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText(/error loading rubrics/i)).toBeInTheDocument();
    });
  });

  it('displays rubric details correctly', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 2 },
    });
    renderRubricList();

    await waitFor(() => {
      // Check titles and descriptions
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
      expect(
        screen.getByText('Evaluation criteria for programming assignments')
      ).toBeInTheDocument();

      // Check scores
      expect(screen.getByText('100')).toBeInTheDocument(); // total score
      expect(screen.getByText('60')).toBeInTheDocument(); // passing score

      // Check assignment titles in table cells only
      const tableBody = screen.getByTestId('table-body');
      const assignmentCells = within(tableBody).getAllByText(/Assignment \d/);
      expect(assignmentCells).toHaveLength(2);
    });
  });

  it('displays criteria details correctly', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 2 },
    });
    renderRubricList();

    await waitFor(() => {
      // Check titles and descriptions
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
      expect(
        screen.getByText('Evaluation criteria for programming assignments')
      ).toBeInTheDocument();

      // Check scores
      expect(screen.getByText('100')).toBeInTheDocument(); // total score
      expect(screen.getByText('60')).toBeInTheDocument(); // passing score

      // Check assignment titles in table cells only
      const tableCells = screen.getAllByTestId('table-cell');
      const assignmentCells = tableCells.filter(
        cell => cell.textContent === 'Assignment 1' || cell.textContent === 'Assignment 2'
      );
      expect(assignmentCells).toHaveLength(2);
    });
  });

  it('allows sorting by different columns', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 2 },
    });
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
    });

    // Click on the "Total Score" column header
    fireEvent.click(screen.getByText('Total Score'));

    expect(api.get).toHaveBeenCalledWith('/rubrics', {
      params: expect.objectContaining({
        sort_by: 'total_score',
        sort_order: 'asc',
      }),
    });
  });

  it('allows filtering by assignment', async () => {
    console.log('Starting assignment filter test');
    (api.get as any)
      .mockResolvedValueOnce({
        data: { rubrics: mockRubrics, total: 2 },
      })
      .mockResolvedValueOnce({
        data: { rubrics: [mockRubrics[0]], total: 1 },
      });
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
    });
    console.log('Initial render complete');

    // Find the select by its aria-label
    const filterSelect = screen.getByLabelText('Filter by Assignment');
    console.log('Found filter select:', filterSelect);

    // Simulate the Material-UI Select change event
    await act(async () => {
      console.log('Opening select dropdown');
      fireEvent.mouseDown(filterSelect);
      const option = await screen.findByRole('option', { name: 'Assignment 1' });
      console.log('Found option:', option);
      fireEvent.click(option);
      console.log('Clicked option');
    });

    // Wait for the state update and API call
    await waitFor(
      () => {
        const calls = (api.get as any).mock.calls;
        console.log(
          'API calls:',
          calls.map(([, opts]: any) => opts.params)
        );
        expect(calls.some(([, opts]: any) => opts.params.assignment === 'Assignment 1')).toBe(true);
      },
      { timeout: 2000 }
    );

    // Verify the filtered results
    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
      expect(screen.queryByText('Essay Writing Rubric')).not.toBeInTheDocument();
    });
    console.log('Assignment filter test complete');
  });

  it('allows changing rows per page', async () => {
    console.log('Starting rows per page test');
    (api.get as any)
      .mockResolvedValueOnce({
        data: { rubrics: mockRubrics, total: 20 },
      })
      .mockResolvedValueOnce({
        data: { rubrics: mockRubrics, total: 20 },
      });
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
    });
    console.log('Initial render complete');

    // Find the select by its role and parent text
    const paginationSection = screen.getByTestId('table-pagination');
    const select = within(paginationSection).getByRole('combobox');
    console.log('Found rows per page select:', select);

    // Simulate the Material-UI Select change event
    await act(async () => {
      console.log('Opening select dropdown');
      fireEvent.mouseDown(select);
      const option = await screen.findByRole('option', { name: '25' });
      console.log('Found option:', option);
      fireEvent.click(option);
      console.log('Clicked option');
    });

    // Wait for the state update and API call
    await waitFor(
      () => {
        const calls = (api.get as any).mock.calls;
        console.log(
          'API calls:',
          calls.map(([, opts]: any) => opts.params)
        );
        expect(calls.some(([, opts]: any) => opts.params.limit === 25)).toBe(true);
      },
      { timeout: 2000 }
    );

    // Verify the pagination section shows the correct rows per page
    await waitFor(() => {
      const paginationSection = screen.getByTestId('table-pagination');
      expect(within(paginationSection).getByText('Rows per page: 25')).toBeInTheDocument();
    });
    console.log('Rows per page test complete');
  });

  it('handles pagination', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 20 },
    });
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
    });

    // Find the next page button by its text content
    const nextPageButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/rubrics', {
        params: expect.objectContaining({
          page: 2,
        }),
      });
    });
  });

  it('allows searching rubrics', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 2 },
    });
    renderRubricList();

    await waitFor(() => {
      expect(screen.getByText('Programming Assignment Rubric')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search rubrics/i);
    fireEvent.change(searchInput, { target: { value: 'Programming' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/rubrics', {
        params: expect.objectContaining({
          search: 'Programming',
        }),
      });
    });
  });

  it('displays timestamps correctly', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { rubrics: mockRubrics, total: 2 },
    });
    renderRubricList();

    await waitFor(() => {
      const date1 = new Date(mockRubrics[0].created_at).toLocaleDateString();
      const date2 = new Date(mockRubrics[1].created_at).toLocaleDateString();
      expect(screen.getByText(new RegExp(date1))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(date2))).toBeInTheDocument();
    });
  });
});
