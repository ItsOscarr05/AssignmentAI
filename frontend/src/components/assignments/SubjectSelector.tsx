import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

interface SubjectOption {
  value: string;
  label: string;
  color: string;
}

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  fullWidth?: boolean;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  { value: 'Math', label: 'Math', color: '#D32F2F' },
  { value: 'Literature', label: 'Literature', color: '#FFD600' },
  { value: 'Science', label: 'Science', color: '#388E3C' },
  { value: 'History', label: 'History', color: '#1976D2' },
  { value: 'Language', label: 'Language', color: '#4FC3F7' },
  { value: 'Technology', label: 'Technology', color: '#B39DDB' },
  { value: 'Business', label: 'Business', color: '#81C784' },
  { value: 'Arts', label: 'Arts', color: '#8E24AA' },
  { value: 'Health / PE', label: 'Health / PE', color: '#FFA000' },
  { value: 'Career & Technical Ed', label: 'Career & Technical Ed', color: '#16A3A6' },
];

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  value,
  onChange,
  label = 'Subject',
  fullWidth = true,
}) => {
  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        label={label}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D32F2F',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D32F2F',
            borderWidth: '2px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D32F2F',
            borderWidth: '2px',
          },
        }}
      >
        {SUBJECT_OPTIONS.map(subject => (
          <MenuItem key={subject.value} value={subject.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: subject.color,
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              />
              <span>{subject.label}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SubjectSelector;
