import { Box, LinearProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const [strength, setStrength] = useState(0);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<'error' | 'warning' | 'info' | 'success'>('error');

  useEffect(() => {
    let score = 0;
    let newLabel = '';
    let newColor: 'error' | 'warning' | 'info' | 'success' = 'error';

    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;

    // Character type checks
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    // Cap at 100
    score = Math.min(score, 100);

    // Set label and color based on score
    if (score < 25) {
      newLabel = 'Very Weak';
      newColor = 'error';
    } else if (score < 50) {
      newLabel = 'Weak';
      newColor = 'error';
    } else if (score < 75) {
      newLabel = 'Medium';
      newColor = 'warning';
    } else if (score < 100) {
      newLabel = 'Strong';
      newColor = 'info';
    } else {
      newLabel = 'Very Strong';
      newColor = 'success';
    }

    setStrength(score);
    setLabel(newLabel);
    setColor(newColor);
  }, [password]);

  if (!password) return null;

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength:
        </Typography>
        <Typography
          variant="caption"
          sx={{
            ml: 1,
            fontWeight: 'bold',
            color: `${color}.main`,
          }}
        >
          {label}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength}
        color={color}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: 'grey.100',
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
          },
        }}
      />
    </Box>
  );
};

export default PasswordStrengthIndicator;
