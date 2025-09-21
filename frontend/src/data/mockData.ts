import { mapToCoreSubject } from '../services/subjectService';

// Assignment interface
export interface Assignment {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  wordCount: number;
  tokensUsed: number;
  subject?: string;
  file_uploads?: Array<{
    id: number;
    filename: string;
    original_filename: string;
    file_type: string;
    is_link: boolean;
    link_url?: string;
    link_title?: string;
    created_at: string;
  }>;
}

// Helper for random selection
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Core and mapped subjects for variety
const allSubjects = [
  'Math',
  'Fitness',
  'Literature',
  'Business',
  'Science',
  'Career & Technical Ed',
  'Language',
  'History',
  'Technology',
  'Arts',
  'Algebra',
  'Geometry',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'Accounting',
  'Spanish',
  'French',
  'Music',
  'Art',
  'PE',
  'Health',
  'Programming',
  'Robotics',
  'World History',
  'Civics',
  'Drama',
  'Band',
  'Dance',
  'Photography',
  'Engineering',
  'Culinary',
  'Marketing',
  'Finance',
  'IT',
  'Visual Arts',
  'Government',
  'Geography',
  'Astronomy',
  'Earth Science',
  'Writing',
  'Composition',
  'Reading',
  'Entrepreneurship',
  'Manufacturing',
  'Computer Science',
  'Choir',
  'Painting',
  'Drawing',
  'Mandarin',
  'Latin',
  'Japanese',
  'German',
  'Italian',
];

const statuses = ['Completed', 'In Progress', 'Not Started'];

// Generate a random number of mock assignments between 40 and 60 (inclusive) per session
const assignmentCount = Math.floor(Math.random() * (60 - 40 + 1)) + 40;

// Set the monthly token limit (e.g., 30,000 for Free plan)
const MONTHLY_TOKEN_LIMIT = 100000;
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

// Step 1: Generate all assignments with random tokens
let rawExtraAssignments = Array.from({ length: assignmentCount }, (_, i) => {
  const subject = randomFrom(allSubjects);
  const status = randomFrom(statuses);
  const daysAgo = Math.floor(Math.random() * 60);
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1200);
  const wordCount = Math.floor(Math.random() * 1601) + 400;
  const tokensUsed = Math.floor(Math.random() * 1801) + 200;
  return {
    id: `mock-extra-${i}`,
    title: `${subject} Assignment #${i + 1}`,
    status,
    createdAt: createdAt.toISOString(),
    wordCount,
    tokensUsed,
    _createdAtDate: createdAt, // for sorting
  };
});

// Step 2: Sort by date (oldest to newest)
rawExtraAssignments.sort((a, b) => a._createdAtDate.getTime() - b._createdAtDate.getTime());

// Step 3: Cap tokensUsed for current month
let tokensUsedThisMonth = 0;
for (let a of rawExtraAssignments) {
  const d = a._createdAtDate;
  if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
    if (tokensUsedThisMonth + a.tokensUsed > MONTHLY_TOKEN_LIMIT) {
      a.tokensUsed = Math.max(0, MONTHLY_TOKEN_LIMIT - tokensUsedThisMonth);
    }
    tokensUsedThisMonth += a.tokensUsed;
    if (tokensUsedThisMonth > MONTHLY_TOKEN_LIMIT) {
      a.tokensUsed = 0;
    }
  }
}
// Remove helper property
const extraAssignments: Assignment[] = rawExtraAssignments.map(
  ({ _createdAtDate, ...rest }) => rest as Assignment
);

// Existing assignments (for demo)
const baseAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Math Homework',
    status: 'Completed',
    createdAt: '2024-03-15T12:00:00Z',
    wordCount: 1200,
    tokensUsed: 800,
    subject: 'Math',
  },
  {
    id: '2',
    title: 'Literature Essay',
    status: 'In Progress',
    createdAt: '2024-03-16T12:00:00Z',
    wordCount: 1800,
    tokensUsed: 1200,
    subject: 'Literature',
  },
  {
    id: '3',
    title: 'Science Project',
    status: 'Not Started',
    createdAt: '2024-03-17T09:00:00Z',
    wordCount: 950,
    tokensUsed: 600,
    subject: 'Science',
  },
  {
    id: '4',
    title: 'History Paper',
    status: 'Completed',
    createdAt: '2024-03-18T14:00:00Z',
    wordCount: 1400,
    tokensUsed: 900,
    subject: 'History',
  },
  {
    id: '5',
    title: 'Language Presentation',
    status: 'Completed',
    createdAt: '2024-03-19T11:00:00Z',
    wordCount: 700,
    tokensUsed: 400,
    subject: 'Language',
  },
  {
    id: '6',
    title: 'Tech Lab',
    status: 'In Progress',
    createdAt: '2024-03-20T13:00:00Z',
    wordCount: 1120,
    tokensUsed: 700,
    subject: 'Technology',
  },
  {
    id: '7',
    title: 'Business Plan',
    status: 'Completed',
    createdAt: '2024-03-21T15:00:00Z',
    wordCount: 1600,
    tokensUsed: 1200,
    subject: 'Business',
  },
  {
    id: '8',
    title: 'Art Portfolio',
    status: 'Not Started',
    createdAt: '2024-03-22T16:00:00Z',
    wordCount: 800,
    tokensUsed: 500,
    subject: 'Arts',
  },
  {
    id: '9',
    title: 'Fitness Report',
    status: 'Completed',
    createdAt: '2024-03-23T08:00:00Z',
    wordCount: 600,
    tokensUsed: 350,
    subject: 'Fitness',
  },
  {
    id: '12',
    title: 'Career Project',
    status: 'In Progress',
    createdAt: '2024-03-24T17:00:00Z',
    wordCount: 1300,
    tokensUsed: 850,
    subject: 'Career & Technical Ed',
  },
];

// Combine base and extra assignments for a seasoned user
export const recentAssignments = [...baseAssignments, ...extraAssignments];

// Ensure all mock assignments have a subject property
export const recentAssignmentsWithSubject = recentAssignments.map(a => ({
  ...a,
  subject: a.subject || mapToCoreSubject(a.title),
}));

// Mock token usage data
export const tokenLimits = [50000, 100000, 150000, 200000, 250000, 400000, 800000];
export const tokenThresholds = [
  { percent: 75, remaining: 22500 },
  { percent: 50, remaining: 15000 },
  { percent: 25, remaining: 7500 },
  { percent: 12, remaining: 3000 },
];

// Mock transactions data
export const mockTransactions = [
  {
    date: new Date().toISOString().slice(0, 10),
    description: 'Token Purchase - Free Tier',
    tokens: 100000,
    summary: 'Monthly free token allocation',
  },
  {
    date: '2024-06-01',
    description: 'Token Purchase - Free Tier',
    tokens: 100000,
    summary: 'Monthly free token allocation',
  },
  {
    date: '2024-05-01',
    description: 'Token Purchase - Free Tier',
    tokens: 100000,
    summary: 'Monthly free token allocation',
  },
  {
    date: '2024-04-01',
    description: 'Token Purchase - Free Tier',
    tokens: 100000,
    summary: 'Monthly free token allocation',
  },
  {
    date: '2024-03-01',
    description: 'Token Purchase - Free Tier',
    tokens: 100000,
    summary: 'Monthly free token allocation',
  },
];

// Mock subscription data
export const mockSubscription = {
  id: 'sub_mock_123',
  status: 'active' as const,
  plan_id: (import.meta as any).env?.VITE_STRIPE_PRICE_FREE || 'price_free',
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancel_at_period_end: false,
  token_limit: 100000,
};

// Mock user data
export const mockUser = {
  id: 'mock_user_123',
  email: 'mock@example.com',
  name: 'Mock User',
  isMockUser: true,
  subscription: mockSubscription,
};
