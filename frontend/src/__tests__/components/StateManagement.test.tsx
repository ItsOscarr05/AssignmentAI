import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AssignmentProvider, useAssignmentState } from '../../contexts/AssignmentContext';
import { SubmissionProvider, useSubmissionState } from '../../contexts/SubmissionContext';
import { UserProvider, useUserState } from '../../contexts/UserContext';

const AllProviders = ({ children }: { children: ReactNode }) => (
  <UserProvider>
    <AssignmentProvider>
      <SubmissionProvider>{children}</SubmissionProvider>
    </AssignmentProvider>
  </UserProvider>
);

describe('State Management', () => {
  describe('Assignment State', () => {
    it('should manage assignment state correctly', () => {
      const { result } = renderHook(() => useAssignmentState(), {
        wrapper: AssignmentProvider,
      });

      const newAssignment = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: new Date(),
        status: 'pending' as const,
      };

      act(() => {
        result.current.addAssignment(newAssignment);
      });

      expect(result.current.assignments).toHaveLength(1);
      expect(result.current.assignments[0]).toEqual(newAssignment);

      const updatedAssignment = { ...newAssignment, title: 'Updated Title' };
      act(() => {
        result.current.updateAssignment(updatedAssignment);
      });

      expect(result.current.assignments[0].title).toBe('Updated Title');

      act(() => {
        result.current.deleteAssignment('1');
      });

      expect(result.current.assignments).toHaveLength(0);
    });
  });

  describe('Submission State', () => {
    it('should manage submission state correctly', () => {
      const { result } = renderHook(() => useSubmissionState(), {
        wrapper: SubmissionProvider,
      });

      const newSubmission = {
        id: '1',
        assignmentId: '1',
        userId: '1',
        content: 'Test Content',
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addSubmission(newSubmission);
      });

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0]).toEqual(newSubmission);

      act(() => {
        result.current.updateSubmissionStatus('1', 'submitted' as const);
      });

      expect(result.current.submissions[0].status).toBe('submitted');
    });
  });

  describe('User State', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should manage user state correctly', () => {
      const { result } = renderHook(() => useUserState(), {
        wrapper: UserProvider,
      });

      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student' as const,
      };

      act(() => {
        result.current.setUser(user);
      });

      expect(result.current.user).toEqual(user);

      act(() => {
        result.current.clearUser();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Combined State', () => {
    it('should work with all providers combined', () => {
      const { result: assignmentResult } = renderHook(() => useAssignmentState(), {
        wrapper: AllProviders,
      });
      const { result: submissionResult } = renderHook(() => useSubmissionState(), {
        wrapper: AllProviders,
      });
      const { result: userResult } = renderHook(() => useUserState(), {
        wrapper: AllProviders,
      });

      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student' as const,
      };

      const assignment = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: new Date(),
        status: 'pending' as const,
      };

      const submission = {
        id: '1',
        assignmentId: '1',
        userId: '1',
        content: 'Test Content',
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
      };

      act(() => {
        userResult.current.setUser(user);
        assignmentResult.current.addAssignment(assignment);
        submissionResult.current.addSubmission(submission);
      });

      expect(userResult.current.user).toEqual(user);
      expect(assignmentResult.current.assignments[0]).toEqual(assignment);
      expect(submissionResult.current.submissions[0]).toEqual(submission);
    });
  });
});
