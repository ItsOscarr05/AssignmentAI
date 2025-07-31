import { useMemo } from 'react';
import { DateFormat, formatDate, formatDateTime, formatRelativeDate } from '../utils/dateFormat';

export const useDateFormat = (userDateFormat: DateFormat = 'MM/DD/YYYY') => {
  const formatDateWithSetting = useMemo(() => {
    return (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDate(dateObj, userDateFormat);
    };
  }, [userDateFormat]);

  const formatDateTimeWithSetting = useMemo(() => {
    return (date: Date | string, includeTime: boolean = true, use24Hour: boolean = false) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDateTime(dateObj, userDateFormat, includeTime, use24Hour);
    };
  }, [userDateFormat]);

  const formatRelativeDateWithSetting = useMemo(() => {
    return (date: Date | string, now: Date = new Date()) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatRelativeDate(dateObj, now);
    };
  }, [userDateFormat]);

  return {
    formatDate: formatDateWithSetting,
    formatDateTime: formatDateTimeWithSetting,
    formatRelativeDate: formatRelativeDateWithSetting,
  };
};
