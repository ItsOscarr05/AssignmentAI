import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Define our custom variants
type CustomVariant = 'primary' | 'secondary' | 'ghost';
type MuiVariant = 'text' | 'outlined' | 'contained';

// Create a type for our custom props
interface CustomButtonProps {
  customVariant?: CustomVariant;
}

// Extend MUI ButtonProps but omit variant
export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: MuiVariant | CustomVariant;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: prop => prop !== 'customVariant',
})<ButtonProps & CustomButtonProps>(({ theme, customVariant }) => ({
  textTransform: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  ...(customVariant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(customVariant === 'secondary' && {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),
  ...(customVariant === 'ghost' && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: 'rgba(220, 38, 38, 0.04)',
    },
  }),
}));

export function Button({ variant, ...props }: ButtonProps) {
  // Determine if we're using a custom variant
  const isCustomVariant = variant === 'primary' || variant === 'secondary' || variant === 'ghost';

  // Map custom variants to MUI variants
  const muiVariant: MuiVariant = isCustomVariant
    ? 'contained'
    : (variant as MuiVariant) || 'contained';

  // Pass custom variant to styled component
  const customVariant = isCustomVariant ? (variant as CustomVariant) : undefined;

  return <StyledButton customVariant={customVariant} variant={muiVariant} {...props} />;
}
