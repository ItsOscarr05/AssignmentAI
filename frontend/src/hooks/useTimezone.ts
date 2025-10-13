import { useEffect, useState } from 'react';
import {
  getUserTimezone,
  formatUTCDistanceToNow,
  formatUTCToTimezone,
  formatUTCToTime,
  formatUTCToDate,
  getTimezoneDisplayName,
  parseUTCTimestamp,
} from '../utils/timezone';

/**
 * Hook to access timezone utilities and user's timezone preference
 */
export const useTimezone = () => {
  const [timezone, setTimezone] = useState<string>(getUserTimezone());

  // Listen for timezone changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'timezone' && e.newValue) {
        setTimezone(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Periodically check for timezone changes (in case it was changed in the same tab)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTimezone = getUserTimezone();
      if (currentTimezone !== timezone) {
        setTimezone(currentTimezone);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [timezone]);

  return {
    timezone,
    displayName: getTimezoneDisplayName(timezone),
    formatDistanceToNow: (utcTimestamp: string) =>
      formatUTCDistanceToNow(utcTimestamp, { addSuffix: true }),
    formatDateTime: (utcTimestamp: string) => formatUTCToTimezone(utcTimestamp),
    formatTime: (utcTimestamp: string) => formatUTCToTime(utcTimestamp),
    formatDate: (utcTimestamp: string) => formatUTCToDate(utcTimestamp),
    parseUTC: parseUTCTimestamp,
  };
};

