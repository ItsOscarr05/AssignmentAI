export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY';

export interface DateFormatConfig {
  format: DateFormat;
  separator: string;
  order: 'MDY' | 'DMY' | 'YMD';
  zeroPad: boolean;
}

export const DATE_FORMAT_CONFIGS: Record<DateFormat, DateFormatConfig> = {
  'MM/DD/YYYY': {
    format: 'MM/DD/YYYY',
    separator: '/',
    order: 'MDY',
    zeroPad: true,
  },
  'DD/MM/YYYY': {
    format: 'DD/MM/YYYY',
    separator: '/',
    order: 'DMY',
    zeroPad: true,
  },
  'YYYY-MM-DD': {
    format: 'YYYY-MM-DD',
    separator: '-',
    order: 'YMD',
    zeroPad: true,
  },
  'DD.MM.YYYY': {
    format: 'DD.MM.YYYY',
    separator: '.',
    order: 'DMY',
    zeroPad: true,
  },
};

/**
 * Format a date according to the specified format
 */
export const formatDate = (date: Date, format: DateFormat): string => {
  const config = DATE_FORMAT_CONFIGS[format];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const yearStr = year.toString();
  const monthStr = config.zeroPad ? month.toString().padStart(2, '0') : month.toString();
  const dayStr = config.zeroPad ? day.toString().padStart(2, '0') : day.toString();

  switch (config.order) {
    case 'MDY':
      return `${monthStr}${config.separator}${dayStr}${config.separator}${yearStr}`;
    case 'DMY':
      return `${dayStr}${config.separator}${monthStr}${config.separator}${yearStr}`;
    case 'YMD':
      return `${yearStr}${config.separator}${monthStr}${config.separator}${dayStr}`;
    default:
      return `${monthStr}${config.separator}${dayStr}${config.separator}${yearStr}`;
  }
};

/**
 * Parse a date string according to the specified format
 */
export const parseDate = (dateString: string, format: DateFormat): Date | null => {
  try {
    const config = DATE_FORMAT_CONFIGS[format];
    const parts = dateString.split(config.separator);

    if (parts.length !== 3) {
      return null;
    }

    let year: number, month: number, day: number;

    switch (config.order) {
      case 'MDY':
        [month, day, year] = parts.map(Number);
        break;
      case 'DMY':
        [day, month, year] = parts.map(Number);
        break;
      case 'YMD':
        [year, month, day] = parts.map(Number);
        break;
      default:
        [month, day, year] = parts.map(Number);
    }

    // Validate date
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    // Adjust month (JavaScript months are 0-indexed)
    month = month - 1;

    const date = new Date(year, month, day);

    // Check if the date is valid (handles edge cases like Feb 30)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }

    return date;
  } catch (error) {
    console.warn('Failed to parse date:', error);
    return null;
  }
};

/**
 * Format a date with time according to the specified format
 */
export const formatDateTime = (
  date: Date,
  format: DateFormat,
  includeTime: boolean = true
): string => {
  const dateStr = formatDate(date, format);

  if (!includeTime) {
    return dateStr;
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Always use 24-hour format for consistency
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return `${dateStr} ${timeStr}`;
};

/**
 * Format a relative date (e.g., "2 days ago", "yesterday")
 */
export const formatRelativeDate = (date: Date, now: Date = new Date()): string => {
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays === 0) {
    if (diffHours === 0) {
      if (diffMinutes === 0) {
        return 'Just now';
      }
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays === -1) {
    return 'Tomorrow';
  } else if (diffDays > 0 && diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffDays < 0 && diffDays > -7) {
    return `In ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
  } else {
    // For dates more than a week away, use the full date format
    return formatDate(date, 'MM/DD/YYYY');
  }
};

/**
 * Get the day of the week name
 */
export const getDayName = (date: Date, short: boolean = false): string => {
  const days = short
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Get the month name
 */
export const getMonthName = (date: Date, short: boolean = false): string => {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
  return months[date.getMonth()];
};

/**
 * Format a date range
 */
export const formatDateRange = (startDate: Date, endDate: Date, format: DateFormat): string => {
  const startStr = formatDate(startDate, format);
  const endStr = formatDate(endDate, format);

  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Check if a date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

/**
 * Get the default date format based on locale
 */
export const getDefaultDateFormat = (locale: string = 'en-US'): DateFormat => {
  // Map common locales to date formats
  const localeFormatMap: Record<string, DateFormat> = {
    'en-US': 'MM/DD/YYYY',
    'en-GB': 'DD/MM/YYYY',
    'en-CA': 'MM/DD/YYYY',
    'en-AU': 'DD/MM/YYYY',
    'de-DE': 'DD.MM.YYYY',
    'de-AT': 'DD.MM.YYYY',
    'de-CH': 'DD.MM.YYYY',
    'fr-FR': 'DD/MM/YYYY',
    'fr-CA': 'YYYY-MM-DD',
    'es-ES': 'DD/MM/YYYY',
    'es-MX': 'DD/MM/YYYY',
    'it-IT': 'DD/MM/YYYY',
    'pt-BR': 'DD/MM/YYYY',
    'pt-PT': 'DD/MM/YYYY',
    'ru-RU': 'DD.MM.YYYY',
    'ja-JP': 'YYYY-MM-DD',
    'ko-KR': 'YYYY-MM-DD',
    'zh-CN': 'YYYY-MM-DD',
    'zh-TW': 'YYYY-MM-DD',
  };

  return localeFormatMap[locale] || 'MM/DD/YYYY';
};
