import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAssignmentsStore } from '../../services/AssignmentsService';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AssignmentsService', () => {
  const mockAssignment = {
    id: '1',
    title: 'Test Assignment',
    description: 'Test Description',
    type: 'homework' as const,
    subject: 'Mathematics',
    gradeLevel: '9th Grade',
    category: 'Homework',
    priority: 'medium' as const,
    status: 'draft' as const,
    dueDate: '2024-03-01',
    allowLateSubmissions: true,
    lateSubmissionPenalty: 10,
    tags: ['Math'],
    courseId: 'course-1',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
  };

  const mockCategories = [
    { id: '1', name: 'Homework', description: 'Regular homework assignments' },
    { id: '2', name: 'Project', description: 'Long-term projects' },
    { id: '3', name: 'Quiz', description: 'Short quizzes' },
  ];

  const mockTags = [
    { id: '1', name: 'Math', color: '#FF0000' },
    { id: '2', name: 'Science', color: '#00FF00' },
    { id: '3', name: 'History', color: '#0000FF' },
  ];

  beforeEach(() => {
    useAssignmentsStore.setState({
      assignments: [],
      currentAssignment: null,
      categories: [],
      tags: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should fetch assignments', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [mockAssignment] });

    await useAssignmentsStore.getState().fetchAssignments();

    const updatedState = useAssignmentsStore.getState();
    expect(updatedState.assignments).toEqual([mockAssignment]);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch assignments'));

    await useAssignmentsStore.getState().fetchAssignments();

    const updatedState = useAssignmentsStore.getState();
    expect(updatedState.assignments).toEqual([]);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBe('Failed to fetch assignments');
  });

  it('should create an assignment', async () => {
    const newAssignment = { ...mockAssignment, id: undefined };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockAssignment });

    const result = await useAssignmentsStore.getState().createAssignment(newAssignment);

    const updatedState = useAssignmentsStore.getState();
    expect(result).toEqual(mockAssignment);
    expect(updatedState.assignments).toEqual([mockAssignment]);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should update an assignment', async () => {
    const updatedAssignment = { ...mockAssignment, title: 'Updated Title' };
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedAssignment });

    useAssignmentsStore.setState({ assignments: [mockAssignment] });
    const result = await useAssignmentsStore
      .getState()
      .updateAssignment('1', { title: 'Updated Title' });

    const updatedState = useAssignmentsStore.getState();
    expect(result).toEqual(updatedAssignment);
    expect(updatedState.assignments).toEqual([updatedAssignment]);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should fetch categories', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockCategories });

    await useAssignmentsStore.getState().fetchCategories();

    const updatedState = useAssignmentsStore.getState();
    expect(updatedState.categories).toEqual(mockCategories);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should fetch tags', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTags });

    await useAssignmentsStore.getState().fetchTags();

    const updatedState = useAssignmentsStore.getState();
    expect(updatedState.tags).toEqual(mockTags);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });
});
