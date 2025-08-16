import { useMemo, useState } from 'react';
import {
  DateFormat,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelativeDate,
  getDayName,
  getMonthName,
  isToday,
  isTomorrow,
  isYesterday,
  parseDate,
} from '../utils/dateFormat';

export const useDateFormat = (userDateFormat: DateFormat = 'MM/DD/YYYY') => {
  const [dateFormat, setDateFormat] = useState<DateFormat>(userDateFormat);

  const formatDateWithSetting = useMemo(() => {
    return (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDate(dateObj, dateFormat);
    };
  }, [dateFormat]);

  const formatDateTimeWithSetting = useMemo(() => {
    return (date: Date | string, includeTime: boolean = true) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDateTime(dateObj, dateFormat, includeTime);
    };
  }, [dateFormat]);

  const formatRelativeDateWithSetting = useMemo(() => {
    return (date: Date | string, now: Date = new Date()) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatRelativeDate(dateObj, now);
    };
  }, []);

  const parseDateWithSetting = useMemo(() => {
    return (dateString: string) => {
      return parseDate(dateString, dateFormat);
    };
  }, [dateFormat]);

  const formatDateRangeWithSetting = useMemo(() => {
    return (startDate: Date, endDate: Date) => {
      return formatDateRange(startDate, endDate, dateFormat);
    };
  }, [dateFormat]);

  const getDayNameWithSetting = useMemo(() => {
    return (date: Date, short: boolean = false) => {
      return getDayName(date, short);
    };
  }, []);

  const getMonthNameWithSetting = useMemo(() => {
    return (date: Date, short: boolean = false) => {
      return getMonthName(date, short);
    };
  }, []);

  const isTodayWithSetting = useMemo(() => {
    return (date: Date) => {
      return isToday(date);
    };
  }, []);

  const isYesterdayWithSetting = useMemo(() => {
    return (date: Date) => {
      return isYesterday(date);
    };
  }, []);

  const isTomorrowWithSetting = useMemo(() => {
    return (date: Date) => {
      return isTomorrow(date);
    };
  }, []);

  const dateFormatOptions = useMemo(
    () => [
      { value: 'MM/DD/YYYY' as DateFormat, label: 'MM/DD/YYYY' },
      { value: 'DD/MM/YYYY' as DateFormat, label: 'DD/MM/YYYY' },
      { value: 'YYYY-MM-DD' as DateFormat, label: 'YYYY-MM-DD' },
      { value: 'DD.MM.YYYY' as DateFormat, label: 'DD.MM.YYYY' },
    ],
    []
  );

  return {
    // State
    dateFormat,

    // Actions
    setDateFormat,

    // Formatting functions
    formatDate: formatDateWithSetting,
    parseDate: parseDateWithSetting,
    formatDateTime: formatDateTimeWithSetting,
    formatRelativeDate: formatRelativeDateWithSetting,
    formatDateRange: formatDateRangeWithSetting,

    // Utility functions
    getDayName: getDayNameWithSetting,
    getMonthName: getMonthNameWithSetting,
    isToday: isTodayWithSetting,
    isYesterday: isYesterdayWithSetting,
    isTomorrow: isTomorrowWithSetting,

    // Options for UI
    dateFormatOptions,
  };
};
