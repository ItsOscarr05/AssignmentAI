import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentProvider, useAssignmentState } from '../../contexts/AssignmentContext';
import { SubmissionProvider, useSubmissionState } from '../../contexts/SubmissionContext';
import { UserProvider, useUserState } from '../../contexts/UserContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded';
}

interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

describe('State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Assignment State', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AssignmentProvider>{children}</AssignmentProvider>
    );

    it('should initialize with empty assignments', () => {
      const { result } = renderHook(() => useAssignmentState(), { wrapper });
      expect(result.current.assignments).toEqual([]);
    });

    it('should add new assignment', () => {
      const { result } = renderHook(() => useAssignmentState(), { wrapper });
      const newAssignment: Assignment = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: new Date(),
        status: 'pending',
      };

      act(() => {
        result.current.addAssignment(newAssignment);
      });

      expect(result.current.assignments).toContainEqual(newAssignment);
    });

    it('should update existing assignment', () => {
      const { result } = renderHook(() => useAssignmentState(), { wrapper });
      const assignment: Assignment = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: new Date(),
        status: 'pending',
      };

      act(() => {
        result.current.addAssignment(assignment);
        result.current.updateAssignment({
          ...assignment,
          title: 'Updated Assignment',
        });
      });

      expect(result.current.assignments[0].title).toBe('Updated Assignment');
    });

    it('should delete assignment', () => {
      const { result } = renderHook(() => useAssignmentState(), { wrapper });
      const assignment: Assignment = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: new Date(),
        status: 'pending',
      };

      act(() => {
        result.current.addAssignment(assignment);
        result.current.deleteAssignment('1');
      });

      expect(result.current.assignments).toHaveLength(0);
    });
  });

  describe('Submission State', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SubmissionProvider>{children}</SubmissionProvider>
    );

    it('should initialize with empty submissions', () => {
      const { result } = renderHook(() => useSubmissionState(), { wrapper });
      expect(result.current.submissions).toEqual([]);
    });

    it('should add new submission', () => {
      const { result } = renderHook(() => useSubmissionState(), { wrapper });
      const newSubmission: Submission = {
        id: '1',
        assignmentId: '1',
        userId: '1',
        content: 'Test Content',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addSubmission(newSubmission);
      });

      expect(result.current.submissions).toContainEqual(newSubmission);
    });

    it('should update submission status', () => {
      const { result } = renderHook(() => useSubmissionState(), { wrapper });
      const submission: Submission = {
        id: '1',
        assignmentId: '1',
        userId: '1',
        content: 'Test Content',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addSubmission(submission);
        result.current.updateSubmissionStatus('1', 'submitted');
      });

      expect(result.current.submissions[0].status).toBe('submitted');
    });
  });

  describe('User State', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    it('should initialize with null user', () => {
      const { result } = renderHook(() => useUserState(), { wrapper });
      expect(result.current.user).toBeNull();
    });

    it('should update user profile', () => {
      const { result } = renderHook(() => useUserState(), { wrapper });
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      };

      act(() => {
        result.current.setUser(user);
      });

      expect(result.current.user).toEqual(user);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });

    it('should clear user state on logout', () => {
      const { result } = renderHook(() => useUserState(), { wrapper });
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      };

      act(() => {
        result.current.setUser(user);
        result.current.clearUser();
      });

      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('State Persistence', () => {
    it('should persist user state to localStorage', () => {
      const { result } = renderHook(() => useUserState(), {
        wrapper: ({ children }) => <UserProvider>{children}</UserProvider>,
      });

      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      };

      act(() => {
        result.current.setUser(user);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });

    it('should restore state from localStorage on initialization', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const { result } = renderHook(() => useUserState(), {
        wrapper: ({ children }) => <UserProvider>{children}</UserProvider>,
      });

      expect(result.current.user).toEqual(user);
    });
  });

  describe('State Synchronization', () => {
    it('should synchronize related states on updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserProvider>
          <AssignmentProvider>
            <SubmissionProvider>{children}</SubmissionProvider>
          </AssignmentProvider>
        </UserProvider>
      );

      const { result: userResult } = renderHook(() => useUserState(), { wrapper });
      const { result: assignmentResult } = renderHook(() => useAssignmentState(), { wrapper });
      const { result: submissionResult } = renderHook(() => useSubmissionState(), { wrapper });

      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      };
      const assignment: Assignment = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: new Date(),
        status: 'pending',
      };

      act(() => {
        userResult.current.setUser(user);
        assignmentResult.current.addAssignment(assignment);
        submissionResult.current.addSubmission({
          id: '1',
          assignmentId: assignment.id,
          userId: user.id,
          content: 'Test Content',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        });
      });

      expect(submissionResult.current.submissions[0].userId).toBe(user.id);
      expect(submissionResult.current.submissions[0].assignmentId).toBe(assignment.id);
    });
  });
});
