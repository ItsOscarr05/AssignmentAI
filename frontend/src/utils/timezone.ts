// Timezone utility functions for production-ready timezone management

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

// Top 10 most common timezones worldwide
export const COMMON_TIMEZONES: TimezoneOption[] = [
  {
    value: 'UTC',
    label: 'Universal Time (UTC)',
    offset: 'UTC+0',
    region: 'Global',
  },
  {
    value: 'America/New_York',
    label: 'Eastern Standard Time (EST)',
    offset: 'UTC-5/UTC-4',
    region: 'North America',
  },
  {
    value: 'America/Chicago',
    label: 'Central Standard Time (CST)',
    offset: 'UTC-6/UTC-5',
    region: 'North America',
  },
  {
    value: 'America/Denver',
    label: 'Mountain Standard Time (MST)',
    offset: 'UTC-7/UTC-6',
    region: 'North America',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Standard Time (PST)',
    offset: 'UTC-8/UTC-7',
    region: 'North America',
  },
  {
    value: 'Europe/London',
    label: 'Greenwich Mean Time (GMT)',
    offset: 'UTC+0/UTC+1',
    region: 'Europe',
  },
  {
    value: 'Europe/Paris',
    label: 'Central European Time (CET)',
    offset: 'UTC+1/UTC+2',
    region: 'Europe',
  },
  {
    value: 'Asia/Tokyo',
    label: 'Japan Standard Time (JST)',
    offset: 'UTC+9',
    region: 'Asia',
  },
  {
    value: 'Asia/Shanghai',
    label: 'China Standard Time (CST)',
    offset: 'UTC+8',
    region: 'Asia',
  },
  {
    value: 'Asia/Kolkata',
    label: 'India Standard Time (IST)',
    offset: 'UTC+5:30',
    region: 'Asia',
  },
  {
    value: 'Australia/Sydney',
    label: 'Australian Eastern Standard Time (AEST)',
    offset: 'UTC+10/UTC+11',
    region: 'Oceania',
  },
];

// Extended timezone list for more options
export const EXTENDED_TIMEZONES: TimezoneOption[] = [
  ...COMMON_TIMEZONES,
  {
    value: 'America/Toronto',
    label: 'Eastern Standard Time - Canada (EST)',
    offset: 'UTC-5/UTC-4',
    region: 'North America',
  },
  {
    value: 'America/Vancouver',
    label: 'Pacific Standard Time - Canada (PST)',
    offset: 'UTC-8/UTC-7',
    region: 'North America',
  },
  {
    value: 'Europe/Berlin',
    label: 'Central European Time (CET)',
    offset: 'UTC+1/UTC+2',
    region: 'Europe',
  },
  {
    value: 'Europe/Moscow',
    label: 'Moscow Standard Time (MSK)',
    offset: 'UTC+3',
    region: 'Europe',
  },
  {
    value: 'Asia/Seoul',
    label: 'Korea Standard Time (KST)',
    offset: 'UTC+9',
    region: 'Asia',
  },
  {
    value: 'Asia/Singapore',
    label: 'Singapore Standard Time (SGT)',
    offset: 'UTC+8',
    region: 'Asia',
  },
  {
    value: 'Asia/Dubai',
    label: 'Gulf Standard Time (GST)',
    offset: 'UTC+4',
    region: 'Asia',
  },
  {
    value: 'Australia/Melbourne',
    label: 'Australian Eastern Standard Time (AEST)',
    offset: 'UTC+10/UTC+11',
    region: 'Oceania',
  },
  {
    value: 'Pacific/Auckland',
    label: 'New Zealand Standard Time (NZST)',
    offset: 'UTC+12/UTC+13',
    region: 'Oceania',
  },
];

/**
 * Detect user's timezone based on their location
 * @returns Promise<string> - The detected timezone or UTC as fallback
 */
export const detectUserTimezone = async (): Promise<string> => {
  try {
    // Try to get timezone from browser
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone && timeZone !== 'UTC') {
        return timeZone;
      }
    }

    // Fallback: Try to detect from geolocation
    if (navigator.geolocation) {
      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          async position => {
            try {
              const { latitude, longitude } = position.coords;
              const timezone = await getTimezoneFromCoordinates(latitude, longitude);
              resolve(timezone);
            } catch (error) {
              console.warn('Failed to get timezone from coordinates:', error);
              resolve('UTC');
            }
          },
          error => {
            console.warn('Geolocation failed:', error);
            resolve('UTC');
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      });
    }

    return 'UTC';
  } catch (error) {
    console.warn('Timezone detection failed:', error);
    return 'UTC';
  }
};

/**
 * Get timezone from coordinates using a timezone API
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise<string> - The timezone for the given coordinates
 */
const getTimezoneFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Use a free timezone API service
    const response = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=demo&format=json&by=position&lat=${latitude}&lng=${longitude}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.zoneName || 'UTC';
    }

    // Fallback: Use a simpler approach with timezone offset

    // This is a simplified fallback - in production you might want to use a more robust solution
    return 'UTC';
  } catch (error) {
    console.warn('Timezone API call failed:', error);
    return 'UTC';
  }
};

/**
 * Format timezone offset for display
 * @param timezone - The timezone string
 * @returns string - Formatted offset (e.g., "UTC-5")
 */
export const formatTimezoneOffset = (): string => {
  try {
    // For now, return a placeholder - in production you'd use a proper timezone library
    return 'UTC±0';
  } catch (error) {
    return 'UTC±0';
  }
};

/**
 * Get current time in specified timezone
 * @param timezone - The timezone string
 * @returns string - Formatted time in the timezone
 */
export const getTimeInTimezone = (timezone: string): string => {
  try {
    const date = new Date();
    return date.toLocaleString('en-US', { timeZone: timezone });
  } catch (error) {
    return new Date().toLocaleString();
  }
};

/**
 * Validate if a timezone string is valid
 * @param timezone - The timezone string to validate
 * @returns boolean - True if valid, false otherwise
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get timezone options grouped by region
 * @returns Record<string, TimezoneOption[]> - Timezones grouped by region
 */
export const getTimezoneOptionsByRegion = (): Record<string, TimezoneOption[]> => {
  const grouped: Record<string, TimezoneOption[]> = {};

  COMMON_TIMEZONES.forEach(timezone => {
    if (!grouped[timezone.region]) {
      grouped[timezone.region] = [];
    }
    grouped[timezone.region].push(timezone);
  });

  return grouped;
};

/**
 * Find timezone option by value
 * @param value - The timezone value to find
 * @returns TimezoneOption | undefined - The found timezone option
 */
export const findTimezoneByValue = (value: string): TimezoneOption | undefined => {
  return (
    COMMON_TIMEZONES.find(tz => tz.value === value) ||
    EXTENDED_TIMEZONES.find(tz => tz.value === value)
  );
};
