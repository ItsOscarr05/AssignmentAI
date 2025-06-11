import { vi } from 'vitest';
import { create } from 'zustand';

// Mock store implementations
const mockAuthStore = create(() => ({
  user: null,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
}));

const mockAIStore = create(() => ({
  models: [],
  selectedModel: null,
  settings: {},
  isLoading: false,
  error: null,
  fetchModels: vi.fn(),
  selectModel: vi.fn(),
  updateSettings: vi.fn(),
  generateContent: vi.fn(),
}));

const mockProfileStore = create(() => ({
  profile: null,
  isLoading: false,
  error: null,
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  updatePreferences: vi.fn(),
}));

const mockAnalyticsStore = create(() => ({
  data: null,
  isLoading: false,
  error: null,
  fetchAnalytics: vi.fn(),
}));

// Mock store hooks
vi.mock('../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore(),
}));

vi.mock('../stores/aiStore', () => ({
  useAIStore: () => mockAIStore(),
}));

vi.mock('../stores/profileStore', () => ({
  useProfileStore: () => mockProfileStore(),
}));

vi.mock('../stores/analyticsStore', () => ({
  useAnalyticsStore: () => mockAnalyticsStore(),
}));

export { mockAIStore, mockAnalyticsStore, mockAuthStore, mockProfileStore };
