import { useCallback, useEffect, useState } from 'react';
import {
  COMMON_TIMEZONES,
  EXTENDED_TIMEZONES,
  detectUserTimezone,
  findTimezoneByValue,
  type TimezoneOption,
} from '../utils/timezone';

interface UseTimezoneReturn {
  timezone: string;
  setTimezone: (timezone: string) => void;
  timezoneOptions: TimezoneOption[];
  detectedTimezone: string | null;
  isDetecting: boolean;
  currentTimezoneInfo: TimezoneOption | undefined;
  refreshDetection: () => Promise<void>;
}

export const useTimezone = (): UseTimezoneReturn => {
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  // Get current timezone info
  const currentTimezoneInfo = findTimezoneByValue(timezone);

  // Detect user's timezone on mount
  const detectTimezone = useCallback(async () => {
    setIsDetecting(true);
    try {
      const detected = await detectUserTimezone();
      setDetectedTimezone(detected);

      // If no timezone is set yet, use the detected one
      if (timezone === 'UTC' && detected !== 'UTC') {
        setTimezoneState(detected);
      }
    } catch (error) {
      console.warn('Failed to detect timezone:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [timezone]);

  // Load saved timezone from localStorage
  const loadSavedTimezone = useCallback(() => {
    try {
      const saved = localStorage.getItem('userTimezone');
      if (saved && saved !== 'UTC') {
        setTimezoneState(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved timezone:', error);
    }
  }, []);

  // Set timezone and save to localStorage
  const setTimezone = useCallback((newTimezone: string) => {
    setTimezoneState(newTimezone);
    try {
      localStorage.setItem('userTimezone', newTimezone);
    } catch (error) {
      console.warn('Failed to save timezone:', error);
    }
  }, []);

  // Refresh timezone detection
  const refreshDetection = useCallback(async () => {
    await detectTimezone();
  }, [detectTimezone]);

  // Initialize on mount
  useEffect(() => {
    loadSavedTimezone();
    detectTimezone();
  }, [loadSavedTimezone, detectTimezone]);

  return {
    timezone,
    setTimezone,
    timezoneOptions: COMMON_TIMEZONES,
    detectedTimezone,
    isDetecting,
    currentTimezoneInfo,
    refreshDetection,
  };
};

// Hook for extended timezone options (when user wants more choices)
export const useExtendedTimezone = (): UseTimezoneReturn => {
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const currentTimezoneInfo = findTimezoneByValue(timezone);

  const detectTimezone = useCallback(async () => {
    setIsDetecting(true);
    try {
      const detected = await detectUserTimezone();
      setDetectedTimezone(detected);

      if (timezone === 'UTC' && detected !== 'UTC') {
        setTimezoneState(detected);
      }
    } catch (error) {
      console.warn('Failed to detect timezone:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [timezone]);

  const loadSavedTimezone = useCallback(() => {
    try {
      const saved = localStorage.getItem('userTimezone');
      if (saved && saved !== 'UTC') {
        setTimezoneState(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved timezone:', error);
    }
  }, []);

  const setTimezone = useCallback((newTimezone: string) => {
    setTimezoneState(newTimezone);
    try {
      localStorage.setItem('userTimezone', newTimezone);
    } catch (error) {
      console.warn('Failed to save timezone:', error);
    }
  }, []);

  const refreshDetection = useCallback(async () => {
    await detectTimezone();
  }, [detectTimezone]);

  useEffect(() => {
    loadSavedTimezone();
    detectTimezone();
  }, [loadSavedTimezone, detectTimezone]);

  return {
    timezone,
    setTimezone,
    timezoneOptions: EXTENDED_TIMEZONES,
    detectedTimezone,
    isDetecting,
    currentTimezoneInfo,
    refreshDetection,
  };
};
