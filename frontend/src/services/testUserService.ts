import { User } from '../types/user';

export interface TestUserData {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences: {
    theme: 'light' | 'dark';

    language: string;
  };
  profile: {
    avatar: string;
    bio: string;
    location: string;
    education: string;
    interests: string[];
  };
  statistics: {
    totalAssignments: number;
    completedAssignments: number;
    averageGrade: number;
    submissionRate: number;
    onTimeSubmissions: number;
    lateSubmissions: number;
    feedbackReceived: number;
    feedbackGiven: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'submission' | 'grade' | 'feedback' | 'assignment' | 'login';
    title: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  subscriptionPlan: string;
  tokenBalance: number;
  assignments: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    wordCount: number;
    tokensUsed: number;
  }>;
}

export class TestUserService {
  private static instance: TestUserService;
  private currentUser: TestUserData | null = null;

  static getInstance(): TestUserService {
    if (!TestUserService.instance) {
      TestUserService.instance = new TestUserService();
    }
    return TestUserService.instance;
  }

  getTestUsers(): TestUserData[] {
    return [
      {
        id: '1',
        email: 'student@test.com',
        name: 'Test Student',
        role: 'student',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',

          language: 'en',
        },
        profile: {
          avatar: 'https://via.placeholder.com/150',
          bio: 'Computer Science student passionate about AI and machine learning. Currently working on research projects and developing web applications.',
          location: 'New York, USA',
          education: 'Bachelor of Science in Computer Science',
          interests: ['Computer Science', 'Machine Learning', 'Web Development', 'Data Analysis'],
        },
        statistics: {
          totalAssignments: 156,
          completedAssignments: 134,
          averageGrade: 87,
          submissionRate: 86,
          onTimeSubmissions: 120,
          lateSubmissions: 14,
          feedbackReceived: 45,
          feedbackGiven: 12,
        },
        recentActivity: [
          {
            id: '1',
            type: 'submission',
            title: 'Research Paper: Machine Learning',
            description: 'Submitted research paper on machine learning algorithms',
            timestamp: new Date('2024-02-15').toISOString(),
          },
          {
            id: '2',
            type: 'grade',
            title: 'Math Assignment: Calculus II',
            description: 'Received grade A- (92%)',
            timestamp: new Date('2024-02-14').toISOString(),
          },
          {
            id: '3',
            type: 'feedback',
            title: 'Physics Lab Report',
            description: 'Received feedback from instructor',
            timestamp: new Date('2024-02-12').toISOString(),
          },
        ],
        subscriptionPlan: 'Pro',
        tokenBalance: 1200,
        assignments: [
          {
            id: '1',
            title: 'Math Homework',
            status: 'Completed',
            createdAt: '2024-03-15T10:00:00Z',
            wordCount: 1200,
            tokensUsed: 800,
          },
          {
            id: '2',
            title: 'Literature Essay',
            status: 'In Progress',
            createdAt: '2024-03-16T12:00:00Z',
            wordCount: 1800,
            tokensUsed: 1200,
          },
          {
            id: '3',
            title: 'Science Project',
            status: 'Not Started',
            createdAt: '2024-03-17T09:00:00Z',
            wordCount: 950,
            tokensUsed: 600,
          },
          {
            id: '4',
            title: 'History Paper',
            status: 'Completed',
            createdAt: '2024-03-18T14:00:00Z',
            wordCount: 1400,
            tokensUsed: 900,
          },
          {
            id: '5',
            title: 'Language Presentation',
            status: 'Completed',
            createdAt: '2024-03-19T11:00:00Z',
            wordCount: 700,
            tokensUsed: 400,
          },
          {
            id: '6',
            title: 'Tech Lab',
            status: 'In Progress',
            createdAt: '2024-03-20T13:00:00Z',
            wordCount: 1100,
            tokensUsed: 700,
          },
          {
            id: '7',
            title: 'Business Plan',
            status: 'Completed',
            createdAt: '2024-03-21T15:00:00Z',
            wordCount: 1600,
            tokensUsed: 1000,
          },
          {
            id: '8',
            title: 'Art Portfolio',
            status: 'Not Started',
            createdAt: '2024-03-22T16:00:00Z',
            wordCount: 800,
            tokensUsed: 500,
          },
          {
            id: '9',
            title: 'Fitness Report',
            status: 'Completed',
            createdAt: '2024-03-23T08:00:00Z',
            wordCount: 600,
            tokensUsed: 350,
          },
          {
            id: '10',
            title: 'Career Project',
            status: 'In Progress',
            createdAt: '2024-03-24T17:00:00Z',
            wordCount: 1300,
            tokensUsed: 850,
          },
          {
            id: 'mock-extra-1',
            title: 'World History Assignment #1',
            status: 'Completed',
            createdAt: '2024-03-25T10:00:00Z',
            wordCount: 1500,
            tokensUsed: 1000,
          },
          {
            id: 'mock-extra-2',
            title: 'Technology Assignment #2',
            status: 'Not Started',
            createdAt: '2024-03-26T10:00:00Z',
            wordCount: 900,
            tokensUsed: 600,
          },
          {
            id: 'mock-extra-3',
            title: 'Economics Assignment #3',
            status: 'Completed',
            createdAt: '2024-03-27T10:00:00Z',
            wordCount: 1100,
            tokensUsed: 700,
          },
        ],
      },
      {
        id: 'test-blank',
        email: 'testuser@blank.com',
        name: 'Test User (Blank)',
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',

          language: 'en',
        },
        profile: {
          avatar: '',
          bio: '',
          location: '',
          education: '',
          interests: [],
        },
        statistics: {
          totalAssignments: 0,
          completedAssignments: 0,
          averageGrade: 0,
          submissionRate: 0,
          onTimeSubmissions: 0,
          lateSubmissions: 0,
          feedbackReceived: 0,
          feedbackGiven: 0,
        },
        recentActivity: [],
        subscriptionPlan: '',
        tokenBalance: 0,
        assignments: [],
      },
    ];
  }

  loginAsTestUser(email: string): TestUserData | null {
    const users = this.getTestUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      this.currentUser = { ...user, updatedAt: new Date().toISOString() };
      localStorage.setItem('testUser', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    return null;
  }

  getCurrentTestUser(): TestUserData | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('testUser');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  updateTestUser(userData: Partial<TestUserData>): TestUserData | null {
    if (this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        ...userData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('testUser', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    return null;
  }

  logoutTestUser(): void {
    this.currentUser = null;
    localStorage.removeItem('testUser');
  }

  // Convert TestUserData to User type for compatibility
  convertToUser(testUser: TestUserData): User {
    return {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      createdAt: testUser.createdAt,
      updatedAt: testUser.updatedAt,
      preferences: testUser.preferences,
      profile: testUser.profile,
    };
  }

  // Get user statistics
  getUserStatistics(userId: string) {
    const users = this.getTestUsers();
    const user = users.find(u => u.id === userId);
    return user?.statistics || null;
  }

  // Get user activity
  getUserActivity(userId: string) {
    const users = this.getTestUsers();
    const user = users.find(u => u.id === userId);
    return user?.recentActivity || [];
  }

  // Add a new assignment to the current test user
  addAssignment(assignment: any) {
    const user = this.getCurrentTestUser();
    if (user) {
      // Initialize assignments array if not present
      (user as any).assignments = (user as any).assignments || [];
      (user as any).assignments.push(assignment);
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser = user;
      return user;
    }
    return null;
  }

  // Mark an assignment as completed by id
  completeAssignment(assignmentId: string) {
    const user = this.getCurrentTestUser();
    if (user && (user as any).assignments) {
      const assignments = (user as any).assignments;
      const assignment = assignments.find((a: any) => a.id === assignmentId);
      if (assignment) {
        assignment.status = 'Completed';
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser = user;
        return user;
      }
    }
    return null;
  }
}

export default TestUserService;
