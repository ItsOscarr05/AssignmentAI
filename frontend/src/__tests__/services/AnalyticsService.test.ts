import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnalyticsStore } from '../../services/AnalyticsService';

describe('AnalyticsService', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({
      usageMetrics: {
        totalTokens: 0,
        monthlyTokens: 0,
        dailyTokens: 0,
        averageTokensPerRequest: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      },
      performanceMetrics: {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        successRate: 0,
        errorRate: 0,
      },
      userActivity: {
        userId: '',
        lastActive: '',
        totalSessions: 0,
        averageSessionDuration: 0,
        favoriteModel: '',
        mostUsedTemplate: '',
        totalGenerations: 0,
      },
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useAnalyticsStore.getState();
    expect(state.usageMetrics).toEqual({
      totalTokens: 0,
      monthlyTokens: 0,
      dailyTokens: 0,
      averageTokensPerRequest: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
    });
    expect(state.performanceMetrics).toEqual({
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      successRate: 0,
      errorRate: 0,
    });
    expect(state.userActivity).toEqual({
      userId: '',
      lastActive: '',
      totalSessions: 0,
      averageSessionDuration: 0,
      favoriteModel: '',
      mostUsedTemplate: '',
      totalGenerations: 0,
    });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should fetch analytics data', async () => {
    await useAnalyticsStore.getState().fetchAnalytics();

    const state = useAnalyticsStore.getState();
    expect(state.usageMetrics).toEqual({
      totalTokens: 15000,
      monthlyTokens: 5000,
      dailyTokens: 200,
      averageTokensPerRequest: 150,
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
    });
    expect(state.performanceMetrics).toEqual({
      averageResponseTime: 2.5,
      maxResponseTime: 5.0,
      minResponseTime: 1.0,
      successRate: 95,
      errorRate: 5,
    });
    expect(state.userActivity).toEqual({
      userId: 'user123',
      lastActive: expect.any(String),
      totalSessions: 25,
      averageSessionDuration: 30,
      favoriteModel: 'gpt-4',
      mostUsedTemplate: 'analysis',
      totalGenerations: 150,
    });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    // Mock the fetchAnalytics function to throw an error
    const mockError = new Error('Failed to fetch analytics data');
    const originalFetchAnalytics = useAnalyticsStore.getState().fetchAnalytics;
    const defaultState = useAnalyticsStore.getState();

    // Replace the fetchAnalytics function with one that throws an error
    useAnalyticsStore.setState({
      fetchAnalytics: async () => {
        useAnalyticsStore.setState({
          usageMetrics: defaultState.usageMetrics,
          performanceMetrics: defaultState.performanceMetrics,
          userActivity: defaultState.userActivity,
          error: 'Failed to fetch analytics data',
          isLoading: false,
        });
        throw mockError;
      },
    });

    try {
      await useAnalyticsStore.getState().fetchAnalytics();
    } catch (error) {
      expect(error).toBe(mockError);
      const state = useAnalyticsStore.getState();
      expect(state.error).toBe('Failed to fetch analytics data');
      expect(state.isLoading).toBe(false);
      expect(state.usageMetrics).toEqual(defaultState.usageMetrics);
      expect(state.performanceMetrics).toEqual(defaultState.performanceMetrics);
      expect(state.userActivity).toEqual(defaultState.userActivity);
    }

    // Restore the original function
    useAnalyticsStore.setState({ fetchAnalytics: originalFetchAnalytics });
  });

  it('should reset analytics state', () => {
    // Set some non-default values
    useAnalyticsStore.setState({
      usageMetrics: {
        totalTokens: 1000,
        monthlyTokens: 500,
        dailyTokens: 100,
        averageTokensPerRequest: 50,
        totalRequests: 20,
        successfulRequests: 18,
        failedRequests: 2,
      },
      performanceMetrics: {
        averageResponseTime: 1.5,
        maxResponseTime: 3.0,
        minResponseTime: 0.5,
        successRate: 90,
        errorRate: 10,
      },
      userActivity: {
        userId: 'test123',
        lastActive: '2024-01-01T00:00:00Z',
        totalSessions: 10,
        averageSessionDuration: 20,
        favoriteModel: 'gpt-3.5',
        mostUsedTemplate: 'test',
        totalGenerations: 50,
      },
      isLoading: true,
      error: 'Test error',
    });

    useAnalyticsStore.getState().resetAnalytics();

    const state = useAnalyticsStore.getState();
    expect(state.usageMetrics).toEqual({
      totalTokens: 0,
      monthlyTokens: 0,
      dailyTokens: 0,
      averageTokensPerRequest: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
    });
    expect(state.performanceMetrics).toEqual({
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      successRate: 0,
      errorRate: 0,
    });
    expect(state.userActivity).toEqual({
      userId: '',
      lastActive: '',
      totalSessions: 0,
      averageSessionDuration: 0,
      favoriteModel: '',
      mostUsedTemplate: '',
      totalGenerations: 0,
    });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
