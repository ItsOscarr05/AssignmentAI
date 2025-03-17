import React from 'react';
import { Skeleton, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  rows?: number;
  height?: number | string;
  width?: number | string;
  variant?: 'text' | 'rectangular' | 'circular';
  spacing?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  rows = 3,
  height = 60,
  width = '100%',
  variant = 'rectangular',
  spacing = 2,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ width }}>
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Skeleton
            variant={variant}
            height={height}
            sx={{
              mb: spacing,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.08)' 
                : 'rgba(255, 255, 255, 0.08)',
            }}
            animation="wave"
          />
        </motion.div>
      ))}
    </Box>
  );
};

export default SkeletonLoader; 