import { useSnackbar } from 'notistack';
import { useCallback } from 'react';
import { usageService } from '../services/usageService';

export const useUsageTracking = (feature: string) => {
  const { enqueueSnackbar } = useSnackbar();

  const trackUsage = useCallback(
    async (action: string, metadata?: Record<string, any>) => {
      try {
        // Check if feature is available
        const isAvailable = await usageService.isFeatureAvailable(feature);
        if (!isAvailable) {
          enqueueSnackbar(`Usage limit exceeded for ${feature}`, { variant: 'error' });
          return false;
        }

        // Track the usage
        await usageService.trackUsage({
          feature,
          action,
          metadata,
        });

        // Get remaining usage
        const remaining = await usageService.getRemainingUsage(feature);
        if (remaining < 5) {
          enqueueSnackbar(`You have ${remaining} uses remaining for ${feature}`, {
            variant: 'warning',
          });
        }

        return true;
      } catch (error) {
        console.error('Error tracking usage:', error);
        enqueueSnackbar('Failed to track usage', { variant: 'error' });
        return false;
      }
    },
    [feature, enqueueSnackbar]
  );

  const checkAvailability = useCallback(async () => {
    try {
      return await usageService.isFeatureAvailable(feature);
    } catch (error) {
      console.error('Error checking feature availability:', error);
      return false;
    }
  }, [feature]);

  const getRemainingUsage = useCallback(async () => {
    try {
      return await usageService.getRemainingUsage(feature);
    } catch (error) {
      console.error('Error getting remaining usage:', error);
      return 0;
    }
  }, [feature]);

  return {
    trackUsage,
    checkAvailability,
    getRemainingUsage,
  };
};
