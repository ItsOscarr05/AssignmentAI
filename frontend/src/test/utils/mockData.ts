import { Assignment, Submission, User } from "../../types";

export const createMockAssignment = (
  overrides: Partial<Assignment> = {}
): Assignment => ({
  id: "1",
  title: "Test Assignment",
  description: "Test Description",
  dueDate: new Date().toISOString(),
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockSubmission = (
  overrides: Partial<Submission> = {}
): Submission => ({
  id: "1",
  assignmentId: "1",
  userId: "1",
  content: "Test Submission",
  status: "submitted",
  submittedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "1",
  name: "Test User",
  email: "test@example.com",
  role: "student",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
