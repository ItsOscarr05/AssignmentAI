import { Language, Refresh } from '@mui/icons-material';
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
import {
  COMMON_TIMEZONES,
  EXTENDED_TIMEZONES,
  detectUserTimezone,
  validateTimezone,
} from '../../utils/timezone';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  onValidationError?: (error: string) => void;
  label?: string;
  showExtended?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  enableAutoDetection?: boolean;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  onValidationError,
  label = 'Timezone',
  showExtended = false,
  fullWidth = true,
  size = 'medium',
  disabled = false,
  enableAutoDetection = false,
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const timezoneOptions = showExtended ? EXTENDED_TIMEZONES : COMMON_TIMEZONES;

  // Group timezones by region
  const groupedTimezones = timezoneOptions.reduce((acc, timezone) => {
    if (!acc[timezone.region]) {
      acc[timezone.region] = [];
    }
    acc[timezone.region].push(timezone);
    return acc;
  }, {} as Record<string, typeof timezoneOptions>);

  // Flatten grouped timezones for rendering
  type FlattenedItem =
    | { type: 'header'; region: string; key: string }
    | { type: 'timezone'; timezone: (typeof timezoneOptions)[0]; key: string };

  const flattenedTimezones: FlattenedItem[] = Object.entries(groupedTimezones).flatMap(
    ([region, timezones]) => [
      { type: 'header' as const, region, key: `header-${region}` },
      ...timezones.map(tz => ({ type: 'timezone' as const, timezone: tz, key: tz.value })),
    ]
  );

  // Auto-detect timezone on first visit
  useEffect(() => {
    if (enableAutoDetection && !value && !isDetecting) {
      handleAutoDetect();
    }
  }, [enableAutoDetection, value, isDetecting]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const detectedTimezone = await detectUserTimezone();
      if (detectedTimezone && detectedTimezone !== 'UTC') {
        const error = validateTimezone(detectedTimezone);
        if (!error) {
          onChange(detectedTimezone);
        } else {
          setValidationError(error);
          onValidationError?.(error);
        }
      }
    } catch (error) {
      console.warn('Failed to auto-detect timezone:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTimezoneChange = (newTimezone: string) => {
    // Validate timezone before changing
    const error = validateTimezone(newTimezone);
    if (error) {
      setValidationError(error);
      onValidationError?.(error);
      return;
    }

    setValidationError(null);
    onChange(newTimezone);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size} disabled={disabled} error={!!validationError}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={e => handleTimezoneChange(e.target.value)}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
          disableScrollLock: true,
        }}
        renderValue={selected => {
          const timezone = timezoneOptions.find(tz => tz.value === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Language fontSize="small" sx={{ flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {timezone?.label || selected}
              </Typography>
              {enableAutoDetection && (
                <Tooltip title="Auto-detect timezone">
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
        {/* Flattened timezone options with headers */}
        {flattenedTimezones.map(item => {
          if (item.type === 'header') {
            return (
              <Box
                key={item.key}
                sx={{
                  px: 2,
                  py: 1,
                  color: 'text.secondary',
                  fontWeight: 'medium',
                  backgroundColor: 'action.hover',
                  fontSize: '0.75rem',
                  pointerEvents: 'none',
                }}
              >
                {item.region}
              </Box>
            );
          } else {
            return (
              <MenuItem
                key={item.key}
                value={item.timezone.value}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {item.timezone.label}
              </MenuItem>
            );
          }
        })}
      </Select>
      {validationError && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {validationError}
        </Typography>
      )}
    </FormControl>
  );
};

export default TimezoneSelector;
