import { Assignment, Class, Event, Submission, User } from '../../types';

export const createMockAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  courseId: 'course-1',
  type: 'essay',
  status: 'published',
  dueDate: new Date().toISOString(),
  subject: 'Math',
  gradeLevel: '10',
  priority: 'medium',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  allowLateSubmissions: true,
  lateSubmissionPenalty: 10,
  ...overrides,
});

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'teacher',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isVerified: true,
};

export const mockAssignment: Assignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  courseId: 'course-1',
  dueDate: new Date().toISOString(),
  status: 'draft',
  type: 'essay',
  gradeLevel: '9th',
  priority: 'high',
  subject: 'Mathematics',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  allowLateSubmissions: true,
  lateSubmissionPenalty: 10,
};

export const mockClass: Class = {
  id: '1',
  name: 'Test Class',
  description: 'Test Class Description',
  teacherId: '1',
  students: ['2', '3'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockEvent: Event = {
  id: '1',
  title: 'Test Event',
  description: 'Test Event Description',
  start: new Date().toISOString(),
  end: new Date(Date.now() + 3600000).toISOString(),
  type: 'class',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockSubmission: Submission = {
  id: '1',
  assignmentId: '1',
  studentId: '2',
  content: 'Test Submission',
  submittedAt: new Date().toISOString(),
  status: 'submitted',
};
