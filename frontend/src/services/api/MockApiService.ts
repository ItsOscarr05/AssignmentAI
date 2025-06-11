import { Assignment, Event, Grade, Message, Student, User } from '../../types';

// Mock data
export const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Introduction to Programming',
    description: 'Basic programming concepts and syntax',
    courseId: '1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
    type: 'essay',
    gradeLevel: '12',
    priority: 'high',
    subject: 'Computer Science',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allowLateSubmissions: true,
    lateSubmissionPenalty: 10,
  },
  {
    id: '2',
    title: 'Data Structures Project',
    description: 'Implementation of common data structures',
    courseId: '1',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    type: 'project',
    gradeLevel: '12',
    priority: 'medium',
    subject: 'Computer Science',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allowLateSubmissions: false,
    lateSubmissionPenalty: 0,
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Math Class',
    description: 'Introduction to Algebra',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    type: 'class',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockGrades: Grade[] = [
  {
    id: '1',
    studentId: '1',
    assignmentId: '1',
    score: 95,
    feedback: 'Excellent work!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    receiverId: '2',
    content: 'Hello',
    createdAt: new Date().toISOString(),
    read: false,
  },
];

const mockStudents: Student[] = [
  {
    id: '1',
    userId: '1',
    classId: '1',
    enrollmentDate: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'teacher',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isVerified: true,
};

export const mockApiService = {
  getAssignments: async (): Promise<Assignment[]> => {
    return mockAssignments;
  },
  getEvents: async (): Promise<Event[]> => {
    return mockEvents;
  },
  getGrades: async (): Promise<Grade[]> => {
    return mockGrades;
  },
  getMessages: async (): Promise<Message[]> => {
    return mockMessages;
  },
  getStudents: async (): Promise<Student[]> => {
    return mockStudents;
  },
  getUser: async (): Promise<User> => {
    return mockUser;
  },
};
