import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

interface FeatureAccessResult {
  hasAccess: boolean;
  currentPlan: string;
  isLoading: boolean;
  error: string | null;
}

export const useFeatureAccess = (featureName: string): FeatureAccessResult => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFeatureAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setCurrentPlan('free');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get current subscription
        const response = await fetch('/api/v1/payments/subscriptions/current', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const subscription = await response.json();

          if (subscription && subscription.status === 'active') {
            // Determine plan based on subscription
            let plan = 'free';
            if (subscription.plan_id) {
              // Map Stripe price IDs to plan names
              if (subscription.plan_id.includes('plus')) {
                plan = 'plus';
              } else if (subscription.plan_id.includes('pro')) {
                plan = 'pro';
              } else if (subscription.plan_id.includes('max')) {
                plan = 'max';
              }
            }

            setCurrentPlan(plan);

            // Check feature access based on plan
            const featureAccess = getFeatureAccess(featureName, plan);
            setHasAccess(featureAccess);
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
  }, [user, featureName]);

  return { hasAccess, currentPlan, isLoading, error };
};

// Feature access matrix based on subscription plans
const getFeatureAccess = (featureName: string, plan: string): boolean => {
  const featureMatrix: Record<string, Record<string, boolean>> = {
    // Smart Content Summarization - Plus, Pro, Max
    smart_content_summarization: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Advanced Research Assistant - Pro, Max
    advanced_research_assistant: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Advanced Content Optimization - Max only
    advanced_content_optimization: {
      free: false,
      plus: false,
      pro: false,
      max: true,
    },
    // Image Analysis - Free, Plus, Pro, Max
    image_analysis: {
      free: true,
      plus: true,
      pro: true,
      max: true,
    },
    // Code Analysis - Plus, Pro, Max
    code_analysis: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Data Analysis - Pro, Max
    data_analysis: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Advanced Writing Analysis - Pro, Max
    advanced_writing_analysis: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Style & Tone Suggestions - Plus, Pro, Max
    style_tone_suggestions: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Extended Templates - Plus, Pro, Max
    extended_templates: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Ad-Free Experience - Pro, Max
    ad_free_experience: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Citation Management - Plus, Pro, Max
    citation_management: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Basic Plagiarism Detection - Plus, Pro, Max
    basic_plagiarism_detection: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Advanced Analytics - Pro, Max
    advanced_analytics: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Priority Support - Pro, Max
    priority_support: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Custom Templates - Max only
    custom_templates: {
      free: false,
      plus: false,
      pro: false,
      max: true,
    },
  };

  const featureAccess = featureMatrix[featureName];
  if (!featureAccess) {
    return false; // Unknown feature
  }

  return featureAccess[plan] || false;
};
