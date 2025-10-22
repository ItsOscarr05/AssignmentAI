import { useCallback, useEffect, useState } from 'react';
import { paymentService, Subscription } from '../services/paymentService';

interface AdPopupConfig {
  // Show ad every X minutes for free users
  intervalMinutes: number;
  // Delay before first ad shows (in milliseconds)
  initialDelayMs: number;
  // How long to wait after "Remind Later" is clicked (in minutes)
  remindLaterDelayMinutes: number;
  // Type of ad to show
  adType: 'upgrade' | 'adsense';
}

const DEFAULT_CONFIG: AdPopupConfig = {
  intervalMinutes: 10, // Show ad every 10 minutes
  initialDelayMs: 60000, // Wait 1 minute after page load
  remindLaterDelayMinutes: 30, // Wait 30 minutes after "Remind Later"
  adType: 'upgrade',
};

// Separate config for AdSense popups
const ADSENSE_CONFIG: AdPopupConfig = {
  intervalMinutes: 20, // Show AdSense popup every 20 minutes
  initialDelayMs: 180000, // Wait 3 minutes after page load (offset from upgrade popup)
  remindLaterDelayMinutes: 30,
  adType: 'adsense',
};

/**
 * Hook to manage ad popup display for free users
 * Automatically shows ads at intervals only for free-tier users
 */
export const useAdPopup = (config: Partial<AdPopupConfig> = {}) => {
  const finalConfig: AdPopupConfig = { ...DEFAULT_CONFIG, ...config };

  return useAdPopupCore(finalConfig);
};

/**
 * Hook specifically for AdSense popup ads (every 20 minutes)
 */
export const useAdSensePopup = (config: Partial<AdPopupConfig> = {}) => {
  const finalConfig: AdPopupConfig = { ...ADSENSE_CONFIG, ...config };

  return useAdPopupCore(finalConfig);
};

/**
 * Core hook logic used by both upgrade and AdSense popups
 */
const useAdPopupCore = (finalConfig: AdPopupConfig) => {
  const [showAd, setShowAd] = useState(false);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is on free plan
  const checkUserPlan = useCallback(async () => {
    try {
      setIsLoading(true);
      const subscription: Subscription = await paymentService.getCurrentSubscription();

      // Check if user is on free plan
      const planId = subscription.plan_id?.toLowerCase() || '';
      const tokenLimit = subscription.token_limit || 0;

      // Free user detection logic:
      // 1. Plan ID contains "free" OR
      // 2. Token limit is exactly 100000 (free tier limit) OR
      // 3. Token limit is less than 100000
      const isFree =
        planId.includes('free') || planId === 'price_test_free' || tokenLimit <= 100000;

      setIsFreeUser(isFree);
      console.log('[AdPopup] User plan check:', {
        planId: subscription.plan_id,
        tokenLimit: subscription.token_limit,
        isFree,
      });
    } catch (error) {
      console.error('[AdPopup] Error checking user plan:', error);
      // On error, assume free user to be safe
      setIsFreeUser(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if we should show the ad based on timing
  const shouldShowAd = useCallback((): boolean => {
    if (!isFreeUser) {
      return false;
    }

    const now = Date.now();
    const storagePrefix = finalConfig.adType === 'adsense' ? 'adsense_' : 'ad_';

    // Check if user clicked "Remind Later"
    const remindLaterTime = localStorage.getItem(`${storagePrefix}remind_later`);
    if (remindLaterTime) {
      const remindLaterTimestamp = parseInt(remindLaterTime, 10);
      const timeSinceRemindLater = now - remindLaterTimestamp;
      const remindLaterDelayMs = finalConfig.remindLaterDelayMinutes * 60 * 1000;

      if (timeSinceRemindLater < remindLaterDelayMs) {
        console.log(`[AdPopup:${finalConfig.adType}] Skipping ad - remind later active`);
        return false;
      } else {
        // Clear the remind later flag if time has passed
        localStorage.removeItem(`${storagePrefix}remind_later`);
      }
    }

    // Check last time ad was shown
    const lastShownTime = localStorage.getItem(`${storagePrefix}last_shown`);
    if (lastShownTime) {
      const lastShownTimestamp = parseInt(lastShownTime, 10);
      const timeSinceLastShown = now - lastShownTimestamp;
      const intervalMs = finalConfig.intervalMinutes * 60 * 1000;

      if (timeSinceLastShown < intervalMs) {
        console.log(`[AdPopup:${finalConfig.adType}] Skipping ad - too soon since last shown`);
        return false;
      }
    }

    return true;
  }, [isFreeUser, finalConfig]);

  // Show the ad
  const displayAd = useCallback(() => {
    if (shouldShowAd()) {
      const storagePrefix = finalConfig.adType === 'adsense' ? 'adsense_' : 'ad_';
      console.log(`[AdPopup:${finalConfig.adType}] Displaying ad`);
      setShowAd(true);
      localStorage.setItem(`${storagePrefix}last_shown`, Date.now().toString());
    }
  }, [shouldShowAd, finalConfig.adType]);

  // Close the ad
  const closeAd = useCallback(() => {
    console.log(`[AdPopup:${finalConfig.adType}] Closing ad`);
    setShowAd(false);
  }, [finalConfig.adType]);

  // Initialize: Check user plan on mount
  useEffect(() => {
    checkUserPlan();
  }, [checkUserPlan]);

  // Set up initial delay timer
  useEffect(() => {
    if (isLoading || !isFreeUser) {
      return;
    }

    // Wait for initial delay before showing first ad
    const initialTimer = setTimeout(() => {
      displayAd();
    }, finalConfig.initialDelayMs);

    return () => clearTimeout(initialTimer);
  }, [isLoading, isFreeUser, finalConfig.initialDelayMs, displayAd]);

  // Set up recurring interval timer
  useEffect(() => {
    if (isLoading || !isFreeUser) {
      return;
    }

    // Set up interval to check if we should show ad
    const intervalMs = finalConfig.intervalMinutes * 60 * 1000;
    const intervalTimer = setInterval(() => {
      displayAd();
    }, intervalMs);

    return () => clearInterval(intervalTimer);
  }, [isLoading, isFreeUser, finalConfig.intervalMinutes, displayAd]);

  // Listen for subscription updates (e.g., user upgrades)
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('[AdPopup] Subscription updated, rechecking plan');
      checkUserPlan();
    };

    window.addEventListener('payment-success', handleSubscriptionUpdate);
    return () => window.removeEventListener('payment-success', handleSubscriptionUpdate);
  }, [checkUserPlan]);

  return {
    showAd,
    closeAd,
    isFreeUser,
    isLoading,
  };
};
