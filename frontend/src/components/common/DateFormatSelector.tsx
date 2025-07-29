import { CalendarToday, Refresh } from '@mui/icons-material';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DateFormat, formatDate, getDefaultDateFormat } from '../../utils/dateFormat';

interface DateFormatSelectorProps {
  value: DateFormat;
  onChange: (format: DateFormat) => void;
  onValidationError?: (error: string) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  enableAutoDetection?: boolean;
  showPreview?: boolean;
}

export const DateFormatSelector: React.FC<DateFormatSelectorProps> = ({
  value,
  onChange,
  onValidationError,
  label = 'Date Format',
  fullWidth = true,
  size = 'medium',
  disabled = false,
  enableAutoDetection = false,
  showPreview = true,
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const dateFormatOptions: { value: DateFormat; label: string; description: string }[] = [
    {
      value: 'MM/DD/YYYY',
      label: 'MM/DD/YYYY',
      description: 'US Standard (Month/Day/Year)',
    },
    {
      value: 'DD/MM/YYYY',
      label: 'DD/MM/YYYY',
      description: 'International (Day/Month/Year)',
    },
    {
      value: 'YYYY-MM-DD',
      label: 'YYYY-MM-DD',
      description: 'ISO Standard (Year-Month-Day)',
    },
    {
      value: 'DD.MM.YYYY',
      label: 'DD.MM.YYYY',
      description: 'European (Day.Month.Year)',
    },
  ];

  // Auto-detect date format on first visit
  useEffect(() => {
    if (enableAutoDetection && !value && !isDetecting) {
      handleAutoDetect();
    }
  }, [enableAutoDetection, value, isDetecting]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const detectedFormat = getDefaultDateFormat(navigator.language);
      const error = validateDateFormat(detectedFormat);
      if (!error) {
        onChange(detectedFormat);
      } else {
        setValidationError(error);
        onValidationError?.(error);
      }
    } catch (error) {
      console.warn('Failed to auto-detect date format:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const validateDateFormat = (format: string): string | null => {
    if (!format || format.trim() === '') {
      return 'Date format is required';
    }

    const validFormats: DateFormat[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'];
    if (!validFormats.includes(format as DateFormat)) {
      return 'Invalid date format';
    }

    return null;
  };

  const handleDateFormatChange = (newFormat: DateFormat) => {
    // Validate date format before changing
    const error = validateDateFormat(newFormat);
    if (error) {
      setValidationError(error);
      onValidationError?.(error);
      return;
    }

    setValidationError(null);
    onChange(newFormat);
  };

  const getPreviewDate = () => {
    const today = new Date();
    return formatDate(today, value);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size} disabled={disabled} error={!!validationError}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={e => handleDateFormatChange(e.target.value as DateFormat)}
        renderValue={selected => {
          const option = dateFormatOptions.find(opt => opt.value === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <CalendarToday fontSize="small" sx={{ flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option?.label || selected}
                </Typography>
                {showPreview && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Preview: {getPreviewDate()}
                  </Typography>
                )}
              </Box>
              {enableAutoDetection && (
                <Tooltip title="Auto-detect date format">
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      handleAutoDetect();
                    }}
                    disabled={isDetecting}
                    sx={{ flexShrink: 0, ml: 1 }}
                  >
                    <Refresh
                      fontSize="small"
                      sx={{
                        animation: isDetecting ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        }}
      >
        {dateFormatOptions.map(option => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" fontWeight="medium">
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.description}
              </Typography>
              {showPreview && (
                <Typography variant="caption" color="primary" sx={{ mt: 0.5 }}>
                  Example: {formatDate(new Date(), option.value)}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      {validationError && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {validationError}
        </Typography>
      )}
    </FormControl>
  );
};

export default DateFormatSelector;
