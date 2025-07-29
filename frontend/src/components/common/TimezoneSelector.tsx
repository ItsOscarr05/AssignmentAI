import { Language } from '@mui/icons-material';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React from 'react';
import { COMMON_TIMEZONES, EXTENDED_TIMEZONES } from '../../utils/timezone';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  label?: string;
  showExtended?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  label = 'Timezone',
  showExtended = false,
  fullWidth = true,
  size = 'medium',
  disabled = false,
}) => {
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

  return (
    <FormControl fullWidth={fullWidth} size={size} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={e => onChange(e.target.value)}
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
    </FormControl>
  );
};

export default TimezoneSelector;
