import { Box, Typography } from '@mui/material';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme => theme.palette.background.paper,
        borderTop: theme => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} AssignmentAI. All rights reserved.
      </Typography>
    </Box>
  );
};
