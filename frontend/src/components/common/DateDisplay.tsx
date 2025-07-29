import { Typography, TypographyProps } from '@mui/material';
import React from 'react';
import { useDateFormatter } from '../../contexts/DateFormatContext';

interface DateDisplayProps extends Omit<TypographyProps, 'children'> {
  date: Date | string;
  format?: 'date' | 'datetime' | 'relative' | 'range';
  includeTime?: boolean;
  showDayName?: boolean;
  showMonthName?: boolean;
  shortNames?: boolean;
  endDate?: Date | string;
  fallback?: string;
  children?: (formattedDate: string) => React.ReactNode;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'date',
  includeTime = false,
  showDayName = false,
  showMonthName = false,
  shortNames = false,
  endDate,
  fallback = 'Invalid date',
  children,
  ...typographyProps
}) => {
  const {
    formatDate,
    parseDate,
    formatDateTime,
    formatRelativeDate,
    formatDateRange,
    getDayName,
    getMonthName,
    isToday,
    isYesterday,
    isTomorrow,
  } = useDateFormatter();

  const parseDateValue = (dateValue: Date | string): Date | null => {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      // Try to parse as ISO string first
      const isoDate = new Date(dateValue);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
      // If that fails, try to parse with current format
      return parseDate(dateValue);
    }
    return null;
  };

  const dateObj = parseDateValue(date);
  const endDateObj = endDate ? parseDateValue(endDate) : null;

  if (!dateObj) {
    return (
      <Typography {...typographyProps} color="text.secondary">
        {fallback}
      </Typography>
    );
  }

  let formattedDate: string;

  switch (format) {
    case 'datetime':
      formattedDate = formatDateTime(dateObj, includeTime);
      break;
    case 'relative':
      formattedDate = formatRelativeDate(dateObj);
      break;
    case 'range':
      if (endDateObj) {
        formattedDate = formatDateRange(dateObj, endDateObj);
      } else {
        formattedDate = formatDate(dateObj);
      }
      break;
    case 'date':
    default:
      let dateStr = formatDate(dateObj);

      if (showDayName) {
        const dayName = getDayName(dateObj, shortNames);
        dateStr = `${dayName}, ${dateStr}`;
      }

      if (showMonthName) {
        const monthName = getMonthName(dateObj, shortNames);
        // Replace the month number with month name
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length >= 2) {
          const monthIndex = format === 'date' ? 0 : 1; // Adjust based on format
          parts[monthIndex] = monthName;
          dateStr = parts.join(format.includes('.') ? '.' : format.includes('-') ? '-' : '/');
        }
      }

      formattedDate = dateStr;
      break;
  }

  // Add special styling for today, yesterday, tomorrow
  let color: string | undefined;
  if (format === 'relative' || format === 'date') {
    if (isToday(dateObj)) {
      color = 'success.main';
    } else if (isYesterday(dateObj)) {
      color = 'warning.main';
    } else if (isTomorrow(dateObj)) {
      color = 'info.main';
    }
  }

  if (children) {
    return <>{children(formattedDate)}</>;
  }

  return (
    <Typography {...typographyProps} color={color}>
      {formattedDate}
    </Typography>
  );
};

// Convenience components for common use cases
export const DateOnly: React.FC<
  Omit<DateDisplayProps, 'format'> & { showDayName?: boolean }
> = props => <DateDisplay {...props} format="date" />;

export const DateTime: React.FC<
  Omit<DateDisplayProps, 'format'> & { includeTime?: boolean }
> = props => <DateDisplay {...props} format="datetime" />;

export const RelativeDate: React.FC<Omit<DateDisplayProps, 'format'>> = props => (
  <DateDisplay {...props} format="relative" />
);

export const DateRange: React.FC<
  Omit<DateDisplayProps, 'format'> & { endDate: Date | string }
> = props => <DateDisplay {...props} format="range" />;

// Specialized components for common patterns
export const AssignmentDate: React.FC<
  Omit<DateDisplayProps, 'format' | 'showDayName'> & {
    isDeadline?: boolean;
    isOverdue?: boolean;
  }
> = ({ isDeadline = false, isOverdue = false, ...props }) => {
  const color = isOverdue ? 'error.main' : isDeadline ? 'warning.main' : undefined;

  return <DateDisplay {...props} format="date" showDayName={true} color={color} />;
};

export const ActivityDate: React.FC<Omit<DateDisplayProps, 'format'>> = props => (
  <DateDisplay {...props} format="relative" />
);

export const SubmissionDate: React.FC<Omit<DateDisplayProps, 'format'>> = props => (
  <DateDisplay {...props} format="datetime" includeTime={true} />
);
