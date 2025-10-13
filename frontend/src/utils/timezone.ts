import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Get the user's timezone preference from localStorage
 * Falls back to browser timezone if not set
 */
export const getUserTimezone = (): string => {
  try {
    // Try to get from localStorage first
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) {
      return savedTimezone;
    }

    // Try to get from preferences API (if available)
    const preferencesStr = localStorage.getItem('preferences');
    if (preferencesStr) {
      const preferences = JSON.parse(preferencesStr);
      if (preferences?.custom_preferences?.timezone) {
        return preferences.custom_preferences.timezone;
      }
    }

    // Fall back to browser timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    console.warn('Failed to get user timezone, defaulting to UTC:', error);
    return 'UTC';
  }
};

/**
 * Parse a UTC timestamp and return it as a Date object
 * The Date object represents the same moment in time, but will display in local timezone
 * @param utcTimestamp - ISO 8601 timestamp string in UTC (should end with 'Z' or have timezone info)
 * @returns Date object
 */
export const parseUTCTimestamp = (utcTimestamp: string): Date => {
  try {
    // Ensure the timestamp is treated as UTC by adding 'Z' if not present
    const timestamp = utcTimestamp.endsWith('Z') || utcTimestamp.includes('+') || utcTimestamp.includes('-', 10)
      ? utcTimestamp
      : `${utcTimestamp}Z`;
    
    return new Date(timestamp);
  } catch (error) {
    console.warn('Failed to parse UTC timestamp:', error);
    return new Date(utcTimestamp);
  }
};

/**
 * Format a UTC timestamp as "time ago" 
 * @param utcTimestamp - ISO 8601 timestamp string in UTC
 * @param options - Options for formatDistanceToNow
 * @returns Formatted string like "5 minutes ago"
 */
export const formatUTCDistanceToNow = (
  utcTimestamp: string,
  options?: { addSuffix?: boolean; includeSeconds?: boolean }
): string => {
  try {
    const date = parseUTCTimestamp(utcTimestamp);
    const result = formatDistanceToNow(date, options);
    
    // Debug logging to help troubleshoot
    if (process.env.NODE_ENV === 'development') {
      console.log('Timezone Debug:', {
        originalTimestamp: utcTimestamp,
        parsedDate: date,
        userTimezone: getUserTimezone(),
        result,
      });
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to format UTC distance:', error);
    return formatDistanceToNow(parseISO(utcTimestamp), options);
  }
};

/**
 * Format a UTC timestamp to a localized date/time string in the user's timezone
 * @param utcTimestamp - ISO 8601 timestamp string in UTC
 * @param options - Intl.DateTimeFormat options
 * @param timezone - Optional timezone override
 * @returns Formatted date string
 */
export const formatUTCToTimezone = (
  utcTimestamp: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  timezone?: string
): string => {
  try {
    const tz = timezone || getUserTimezone();
    const date = parseUTCTimestamp(utcTimestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: tz,
    }).format(date);
  } catch (error) {
    console.warn('Failed to format UTC to timezone:', error);
    const date = parseUTCTimestamp(utcTimestamp);
    return date.toLocaleString();
  }
};

/**
 * Format a UTC timestamp to just the time in the user's timezone
 * @param utcTimestamp - ISO 8601 timestamp string in UTC
 * @param timezone - Optional timezone override
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatUTCToTime = (
  utcTimestamp: string,
  timezone?: string
): string => {
  return formatUTCToTimezone(
    utcTimestamp,
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    timezone
  );
};

/**
 * Format a UTC timestamp to just the date in the user's timezone
 * @param utcTimestamp - ISO 8601 timestamp string in UTC
 * @param timezone - Optional timezone override
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatUTCToDate = (
  utcTimestamp: string,
  timezone?: string
): string => {
  return formatUTCToTimezone(
    utcTimestamp,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    timezone
  );
};

/**
 * Get a human-readable timezone name
 * @param timezone - IANA timezone identifier
 * @returns Formatted timezone name
 */
export const getTimezoneDisplayName = (timezone?: string): string => {
  try {
    const tz = timezone || getUserTimezone();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long',
    });
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || tz;
  } catch (error) {
    console.warn('Failed to get timezone display name:', error);
    return timezone || 'UTC';
  }
};

/**
 * Get the timezone offset string (e.g., "UTC-5" or "UTC+3")
 * @param timezone - IANA timezone identifier
 * @returns Offset string
 */
export const getTimezoneOffset = (timezone?: string): string => {
  try {
    const tz = timezone || getUserTimezone();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    return offsetPart?.value || 'UTC';
  } catch (error) {
    console.warn('Failed to get timezone offset:', error);
    return 'UTC';
  }
};

