import { Box, Typography } from '@mui/material';
import React from 'react';
import { useAdContext } from '../../contexts/AdContext';

interface AdComponentProps {
  position: 'top' | 'bottom' | 'sidebar';
}

const AdComponent: React.FC<AdComponentProps> = ({ position }) => {
  const { showAds, isLoading } = useAdContext();

  if (isLoading || !showAds) {
    return null;
  }

  // Different ad styles based on position
  const adStyles = {
    top: {
      width: '100%',
      height: '90px',
      marginBottom: '20px',
    },
    bottom: {
      width: '100%',
      height: '90px',
      marginTop: '20px',
    },
    sidebar: {
      width: '300px',
      height: '600px',
      marginLeft: '20px',
    },
  };

  return (
    <Box
      sx={{
        ...adStyles[position],
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Advertisement
      </Typography>
      {/* Here you would integrate your actual ad network (e.g., Google AdSense) */}
    </Box>
  );
};

export default AdComponent;
