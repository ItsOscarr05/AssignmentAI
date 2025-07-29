import { useCallback, useEffect, useState } from 'react';
import {
  DateFormat,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelativeDate,
  getDayName,
  getDefaultDateFormat,
  getMonthName,
  isToday,
  isTomorrow,
  isYesterday,
  parseDate,
} from '../utils/dateFormat';

interface UseDateFormatReturn {
  // State
  dateFormat: DateFormat;
  use24HourFormat: boolean;

  // Actions
  setDateFormat: (format: DateFormat) => void;
  setUse24HourFormat: (use24Hour: boolean) => void;

  // Formatting functions
  formatDate: (date: Date) => string;
  parseDate: (dateString: string) => Date | null;
  formatDateTime: (date: Date, includeTime?: boolean) => string;
  formatRelativeDate: (date: Date) => string;
  formatDateRange: (startDate: Date, endDate: Date) => string;

  // Utility functions
  getDayName: (date: Date, short?: boolean) => string;
  getMonthName: (date: Date, short?: boolean) => string;
  isToday: (date: Date) => boolean;
  isYesterday: (date: Date) => boolean;
  isTomorrow: (date: Date) => boolean;

  // Options for UI
  dateFormatOptions: { value: DateFormat; label: string }[];
}

export const useDateFormat = (initialDateFormat?: DateFormat): UseDateFormatReturn => {
  const [dateFormat, setDateFormatState] = useState<DateFormat>(initialDateFormat || 'MM/DD/YYYY');
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(false);

  // Date format options for UI
  const dateFormatOptions: { value: DateFormat; label: string }[] = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (European)' },
  ];

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedDateFormat = localStorage.getItem('dateFormat') as DateFormat;
    const saved24Hour = localStorage.getItem('use24HourFormat');

    if (
      savedDateFormat &&
      ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'].includes(savedDateFormat)
    ) {
      setDateFormatState(savedDateFormat);
    } else if (!initialDateFormat) {
      // Auto-detect based on locale if no initial format provided
      const detectedFormat = getDefaultDateFormat(navigator.language);
      setDateFormatState(detectedFormat);
    }

    if (saved24Hour) {
      setUse24HourFormatState(saved24Hour === 'true');
    }
  }, [initialDateFormat]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dateFormat', dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    localStorage.setItem('use24HourFormat', use24HourFormat.toString());
  }, [use24HourFormat]);

  // Set date format
  const setDateFormat = useCallback((newFormat: DateFormat) => {
    setDateFormatState(newFormat);
  }, []);

  // Set 24-hour format
  const setUse24HourFormat = useCallback((use24Hour: boolean) => {
    setUse24HourFormatState(use24Hour);
  }, []);

  // Format date with current user preference
  const formatDateWithPreference = useCallback(
    (date: Date): string => {
      return formatDate(date, dateFormat);
    },
    [dateFormat]
  );

  // Parse date with current user preference
  const parseDateWithPreference = useCallback(
    (dateString: string): Date | null => {
      return parseDate(dateString, dateFormat);
    },
    [dateFormat]
  );

  // Format date and time with current user preference
  const formatDateTimeWithPreference = useCallback(
    (date: Date, includeTime: boolean = true): string => {
      return formatDateTime(date, dateFormat, includeTime, use24HourFormat);
    },
    [dateFormat, use24HourFormat]
  );

  // Format relative date
  const formatRelativeDateWithPreference = useCallback((date: Date): string => {
    return formatRelativeDate(date);
  }, []);

  // Format date range
  const formatDateRangeWithPreference = useCallback(
    (startDate: Date, endDate: Date): string => {
      return formatDateRange(startDate, endDate, dateFormat);
    },
    [dateFormat]
  );

  // Get day name
  const getDayNameWithPreference = useCallback((date: Date, short: boolean = false): string => {
    return getDayName(date, short);
  }, []);

  // Get month name
  const getMonthNameWithPreference = useCallback((date: Date, short: boolean = false): string => {
    return getMonthName(date, short);
  }, []);

  // Check if date is today
  const isTodayWithPreference = useCallback((date: Date): boolean => {
    return isToday(date);
  }, []);

  // Check if date is yesterday
  const isYesterdayWithPreference = useCallback((date: Date): boolean => {
    return isYesterday(date);
  }, []);

  // Check if date is tomorrow
  const isTomorrowWithPreference = useCallback((date: Date): boolean => {
    return isTomorrow(date);
  }, []);

  return {
    // State
    dateFormat,
    use24HourFormat,

    // Actions
    setDateFormat,
    setUse24HourFormat,

    // Formatting functions
    formatDate: formatDateWithPreference,
    parseDate: parseDateWithPreference,
    formatDateTime: formatDateTimeWithPreference,
    formatRelativeDate: formatRelativeDateWithPreference,
    formatDateRange: formatDateRangeWithPreference,

    // Utility functions
    getDayName: getDayNameWithPreference,
    getMonthName: getMonthNameWithPreference,
    isToday: isTodayWithPreference,
    isYesterday: isYesterdayWithPreference,
    isTomorrow: isTomorrowWithPreference,

    // Options for UI
    dateFormatOptions,
  };
};
