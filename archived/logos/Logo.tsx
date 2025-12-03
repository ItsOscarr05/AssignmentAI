import { Box } from '@mui/material';

export const Logo = () => {
  return (
    <Box
      component="img"
      src="/assets/logo.svg"
      alt="AssignmentAI Logo"
      width="40"
      height="40"
      sx={{
        width: { xs: 32, sm: 40 },
        height: { xs: 32, sm: 40 },
      }}
    />
  );
};
