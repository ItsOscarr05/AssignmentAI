import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

interface FeatureAccessResult {
  hasAccess: boolean;
  currentPlan: string;
  isLoading: boolean;
  error: string | null;
}

const isTestEnvironment = (): boolean => {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
    return import.meta.env.MODE === 'test';
  }
  return false;
};

export const useFeatureAccess = (featureName: string): FeatureAccessResult => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testMode = useMemo(isTestEnvironment, []);

  useEffect(() => {
    if (testMode) {
      setHasAccess(true);
      setCurrentPlan('max');
      setError(null);
      setIsLoading(false);
      return;
    }

    const checkFeatureAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setCurrentPlan('free');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch('/api/v1/payments/subscriptions/current', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
          },
        });

        if (response.ok) {
          const subscription = await response.json();

          if (subscription && subscription.status === 'active') {
            const plan = mapPlanIdToPlan(subscription.plan_id);
            setCurrentPlan(plan);
            setHasAccess(getFeatureAccess(featureName, plan));
          } else {
            setCurrentPlan('free');
            setHasAccess(false);
          }
        } else {
          setCurrentPlan('free');
          setHasAccess(false);
        }
      } catch (err) {
        setError('Failed to check feature access');
        setCurrentPlan('free');
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeatureAccess();
  }, [user, featureName, testMode]);

  return { hasAccess, currentPlan, isLoading, error };
};

const mapPlanIdToPlan = (planId?: string | null): string => {
  if (!planId) {
    return 'free';
  }
  const normalized = String(planId).toLowerCase();
  if (normalized.includes('max')) return 'max';
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('plus')) return 'plus';
  return 'free';
};

const featureMatrix: Record<string, Record<string, boolean>> = {
  basic_assignment_generation: {
    free: true,
    plus: true,
    pro: true,
    max: true,
  },
  assignmentai_core_assistant: {
    free: true,
    plus: true,
    pro: true,
    max: true,
  },
  grammar_spelling_check: {
    free: true,
    plus: true,
    pro: true,
    max: true,
  },
  basic_writing_suggestions: {
    free: true,
    plus: true,
    pro: true,
    max: true,
  },
  basic_templates: {
    free: true,
    plus: true,
    pro: true,
    max: true,
  },
  standard_templates: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  extended_templates: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  advanced_templates: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  custom_templates: {
    free: false,
    plus: false,
    pro: false,
    max: true,
  },
  image_analysis: {
    free: true,
    plus: true,
    pro: true,
    max: true,
  },
  code_analysis: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  code_review_assistant: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  citation_management: {
    free: false,
    plus: false,
    pro: true,
    max: true,
  },
  data_analysis: {
    free: false,
    plus: false,
    pro: true,
    max: true,
  },
  diagram_generation: {
    free: false,
    plus: false,
    pro: true,
    max: true,
  },
  advanced_writing_analysis: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  style_tone_suggestions: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  advanced_analytics: {
    free: false,
    plus: false,
    pro: false,
    max: true,
  },
  smart_content_summarization: {
    free: false,
    plus: true,
    pro: true,
    max: true,
  },
  advanced_research_assistant: {
    free: false,
    plus: false,
    pro: true,
    max: true,
  },
  advanced_content_optimization: {
    free: false,
    plus: false,
    pro: false,
    max: true,
  },
};

const getFeatureAccess = (featureName: string, plan: string): boolean => {
  const matrix = featureMatrix[featureName];
  if (!matrix) {
    return false;
  }
  return matrix[plan] ?? false;
};

