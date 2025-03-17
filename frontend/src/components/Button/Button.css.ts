import { style, styleVariants } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  borderRadius: '0.375rem',
  fontWeight: '500',
  transition: 'all 150ms ease',
  cursor: 'pointer',
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  ':focus-visible': {
    outline: `2px solid ${vars.colors.primary}`,
    outlineOffset: '2px',
  },
});

const sizes = styleVariants({
  sm: {
    padding: `${vars.space.xs} ${vars.space.sm}`,
    fontSize: vars.fontSizes.sm,
    height: '2rem',
  },
  md: {
    padding: `${vars.space.sm} ${vars.space.md}`,
    fontSize: vars.fontSizes.md,
    height: '2.5rem',
  },
  lg: {
    padding: `${vars.space.md} ${vars.space.lg}`,
    fontSize: vars.fontSizes.lg,
    height: '3rem',
  },
});

const variants = styleVariants({
  primary: {
    backgroundColor: vars.colors.primary,
    color: '#ffffff',
    ':hover': {
      backgroundColor: vars.colors.info,
    },
  },
  secondary: {
    backgroundColor: vars.colors.secondary,
    color: '#ffffff',
    ':hover': {
      filter: 'brightness(110%)',
    },
  },
  outline: {
    backgroundColor: 'transparent',
    border: `1px solid ${vars.colors.primary}`,
    color: vars.colors.primary,
    ':hover': {
      backgroundColor: vars.colors.primary,
      color: '#ffffff',
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: vars.colors.text,
    ':hover': {
      backgroundColor: vars.colors.surface,
    },
  },
});

export const button = recipe({
  base,
  variants: {
    size: sizes,
    variant: variants,
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    loading: {
      true: {
        position: 'relative',
        pointerEvents: 'none',
        ':after': {
          content: '""',
          position: 'absolute',
          width: '1rem',
          height: '1rem',
          border: '2px solid transparent',
          borderTopColor: 'currentColor',
          borderRightColor: 'currentColor',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  },
}); 