export const useFormatting = () => {
  // Default to English locale for now
  const locale = 'en-US';

  const formatDate = (date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  };

  const formatTime = (date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      ...options,
    }).format(dateObj);
  };

  const formatDateTime = (date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      ...options,
    }).format(dateObj);
  };

  const formatNumber = (number: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (
    amount: number,
    currency: string,
    options: Intl.NumberFormatOptions = {}
  ) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  };

  const formatPercentage = (value: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      ...options,
    }).format(value);
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${formatNumber(size, { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatFileSize,
  };
};
