export const mockUsers = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'student' as const,
  },
  {
    id: '2',
    name: 'Test Instructor',
    email: 'instructor@example.com',
    role: 'instructor' as const,
  },
];

export const mockAssignments = [
  {
    id: '1',
    title: 'Test Assignment 1',
    description: 'Test Description 1',
    dueDate: new Date().toISOString(),
    status: 'pending' as const,
  },
  {
    id: '2',
    title: 'Test Assignment 2',
    description: 'Test Description 2',
    dueDate: new Date().toISOString(),
    status: 'submitted' as const,
  },
];

export const mockSubmissions = [
  {
    id: '1',
    assignmentId: '1',
    userId: '1',
    content: 'Test Content 1',
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  },
  {
    id: '2',
    assignmentId: '2',
    userId: '1',
    content: 'Test Content 2',
    status: 'submitted' as const,
    submittedAt: new Date().toISOString(),
  },
];
