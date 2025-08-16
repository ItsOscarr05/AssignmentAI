import React, { createContext, ReactNode, useContext } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import { DateFormat } from '../utils/dateFormat';

interface DateFormatContextType {
  // State
  dateFormat: DateFormat;

  // Actions
  setDateFormat: (format: DateFormat) => void;

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

const DateFormatContext = createContext<DateFormatContextType | undefined>(undefined);

interface DateFormatProviderProps {
  children: ReactNode;
  initialDateFormat?: DateFormat;
}

export const DateFormatProvider: React.FC<DateFormatProviderProps> = ({
  children,
  initialDateFormat,
}) => {
  const dateFormatHook = useDateFormat(initialDateFormat);

  return <DateFormatContext.Provider value={dateFormatHook}>{children}</DateFormatContext.Provider>;
};

export const useDateFormatContext = (): DateFormatContextType => {
  const context = useContext(DateFormatContext);
  if (context === undefined) {
    throw new Error('useDateFormatContext must be used within a DateFormatProvider');
  }
  return context;
};

// Convenience hook for components that only need formatting functions
export const useDateFormatter = () => {
  const context = useDateFormatContext();
  return {
    formatDate: context.formatDate,
    parseDate: context.parseDate,
    formatDateTime: context.formatDateTime,
    formatRelativeDate: context.formatRelativeDate,
    formatDateRange: context.formatDateRange,
    getDayName: context.getDayName,
    getMonthName: context.getMonthName,
    isToday: context.isToday,
    isYesterday: context.isYesterday,
    isTomorrow: context.isTomorrow,
  };
};
