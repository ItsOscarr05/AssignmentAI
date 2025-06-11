import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const IconContainer = styled(Box)(({}) => ({
  position: 'relative',
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
}));

const Scroll = styled(DescriptionIcon)(({ theme }) => ({
  fontSize: '60px',
  color: theme.palette.primary.main,
  position: 'relative',
  zIndex: 1,
}));

const Quill = styled(EditIcon)(({ theme }) => ({
  fontSize: '30px',
  color: theme.palette.primary.main,
  position: 'absolute',
  top: '20%',
  right: '20%',
  transform: 'rotate(45deg)',
  zIndex: 2,
}));

interface AppIconProps {
  size?: number;
}

export default function AppIcon({ size = 100 }: AppIconProps) {
  return (
    <IconContainer sx={{ width: size, height: size }}>
      <Scroll sx={{ fontSize: size * 0.6 }} />
      <Quill sx={{ fontSize: size * 0.3 }} />
    </IconContainer>
  );
}
