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
// Updated to match the new pricing structure
const getFeatureAccess = (featureName: string, plan: string): boolean => {
  const featureMatrix: Record<string, Record<string, boolean>> = {
    // Core Features - Available to all plans
    assignmentai_core_assistant: {
      free: true,
      plus: true,
      pro: true,
      max: true,
    },
    basic_assignment_generation: {  // Legacy alias
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
      free: true,
      plus: true,
      pro: true,
      max: true,
    },
    // Tiered features
    advanced_templates: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    custom_templates: {
      free: false,
      plus: false,
      pro: false,
      max: true,
    },
    // Plus tier features
    style_tone_analysis: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    enhanced_writing_suggestions: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Pro tier features
    image_analysis: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    code_review_assistant: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    code_analysis: {  // Legacy alias for code_review_assistant
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    citation_management: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    custom_writing_tone: {
      free: false,
      plus: false,
      pro: true,
      max: true,
    },
    // Max tier features
    performance_insights_dashboard: {
      free: false,
      plus: false,
      pro: false,
      max: true,
    },
    advanced_analytics: {  // Legacy alias
      free: false,
      plus: false,
      pro: false,
      max: true,
    },
    // Ad logic - only free shows ads
    ad_free_experience: {
      free: false,
      plus: true,
      pro: true,
      max: true,
    },
    // Legacy features (kept for backward compatibility)
    smart_content_summarization: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    advanced_research_assistant: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    advanced_content_optimization: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    data_analysis: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    advanced_writing_analysis: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    style_tone_suggestions: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    extended_templates: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    basic_plagiarism_detection: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
    priority_support: {
      free: false,
      plus: false,
      pro: false,
      max: false,
    },
  };

  const featureAccess = featureMatrix[featureName];
  if (!featureAccess) {
    return false; // Unknown feature
  }

  return featureAccess[plan] || false;
};
