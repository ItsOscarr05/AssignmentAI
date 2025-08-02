import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBackButton = true, onBackClick }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  // Function to wrap the last word of the title on mobile
  const renderTitle = (titleText: string) => {
    const words = titleText.split(' ');
    if (words.length <= 1) return titleText;

    const allButLast = words.slice(0, -1).join(' ');
    const lastWord = words[words.length - 1];

    return (
      <>
        <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
          {allButLast}
        </Box>
        <Box
          component="span"
          sx={{
            display: { xs: 'block', sm: 'inline' },
            ml: { xs: 0, sm: 1 },
          }}
        >
          {lastWord}
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      {/* Back Button - Positioned absolutely */}
      {showBackButton && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{
            position: 'absolute',
            top: { xs: 0, sm: 0 },
            right: 0,
            color: '#D32F2F',
            backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000814' : 'white'),
            border: '2px solid #D32F2F',
            borderRadius: '8px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.01em',
            textTransform: 'none',
            fontSize: '1rem',
            py: 1,
            px: 2,
            zIndex: 2,
            '&:hover': {
              backgroundColor: theme => (theme.palette.mode === 'dark' ? '#001122' : '#f5f5f5'),
              border: '2px solid #B71C1C',
              color: '#B71C1C',
            },
          }}
        >
          Back
        </Button>
      )}

      {/* Page Title - With responsive wrapping */}
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 700,
          color: 'primary.main',
          letterSpacing: 1,
          pr: { xs: 8, sm: 10 }, // Add right padding to prevent overlap with back button
          lineHeight: { xs: 1.2, sm: 1.3 },
          fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' },
        }}
      >
        {renderTitle(title)}
      </Typography>
    </Box>
  );
};

export default PageHeader;
