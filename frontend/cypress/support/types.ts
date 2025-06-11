// Type definitions for the test suite

export interface User {
  email: string;
  password: string;
  name: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'draft' | 'published' | 'submitted' | 'graded';
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  fileUrl: string;
  submittedAt: string;
  status: 'pending' | 'analyzed' | 'graded';
}

export interface Feedback {
  id: string;
  submissionId: string;
  userId: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string;
}

export interface Settings {
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export interface TestData {
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  feedback: Feedback[];
  profiles: Profile[];
  settings: Settings[];
}

// Custom type for test configuration
export interface TestConfig {
  baseUrl: string;
  apiUrl: string;
  defaultTimeout: number;
  retryAttempts: number;
  viewport: {
    width: number;
    height: number;
  };
}

// Type for test environment variables
export interface TestEnv {
  API_URL: string;
  TEST_USER_EMAIL: string;
  TEST_USER_PASSWORD: string;
  TEST_ADMIN_EMAIL: string;
  TEST_ADMIN_PASSWORD: string;
}

// Type for test fixtures
export interface TestFixtures {
  testUser: User;
  testAssignment: Assignment;
  testSubmission: Submission;
  testFeedback: Feedback;
}

// Type for custom commands
export interface CustomCommands {
  login: (email: string, password: string) => Cypress.Chainable;
  createAssignment: (title: string, description: string, dueDate: string) => Cypress.Chainable;
  submitAssignment: (assignmentId: string, filePath: string) => Cypress.Chainable;
  provideFeedback: (assignmentId: string, feedback: string, rating: number) => Cypress.Chainable;
  updateProfile: (name: string, bio: string) => Cypress.Chainable;
  updateSettings: (settings: Partial<Settings>) => Cypress.Chainable;
  mockApiResponse: (method: string, url: string, response: any) => Cypress.Chainable;
  mockApiError: (method: string, url: string, statusCode?: number) => Cypress.Chainable;
  clearAllData: () => Cypress.Chainable;
  waitForLoading: () => Cypress.Chainable;
  checkErrorMessage: (message: string) => Cypress.Chainable;
  checkSuccessMessage: (message: string) => Cypress.Chainable;
  typeWithDelay: (selector: string, text: string, delay?: number) => Cypress.Chainable;
  dragAndDrop: (subject: string, target: string) => Cypress.Chainable;
  checkA11y: () => Cypress.Chainable;
}

// Type for test utilities
export interface TestUtils {
  generateTestData: () => TestData;
  resetTestData: () => Promise<void>;
  createTestUser: () => Promise<User>;
  createTestAssignment: () => Promise<Assignment>;
  createTestSubmission: () => Promise<Submission>;
  createTestFeedback: () => Promise<Feedback>;
}

// Type for test assertions
export interface TestAssertions {
  shouldHaveValidResponse: (response: ApiResponse<any>) => void;
  shouldHaveValidError: (error: ApiError) => void;
  shouldHaveValidUser: (user: User) => void;
  shouldHaveValidAssignment: (assignment: Assignment) => void;
  shouldHaveValidSubmission: (submission: Submission) => void;
  shouldHaveValidFeedback: (feedback: Feedback) => void;
}

// Type for test hooks
export interface TestHooks {
  beforeAll: () => Promise<void>;
  afterAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
}

// Type for test configuration
export interface TestConfiguration {
  config: TestConfig;
  env: TestEnv;
  fixtures: TestFixtures;
  commands: CustomCommands;
  utils: TestUtils;
  assertions: TestAssertions;
  hooks: TestHooks;
}
