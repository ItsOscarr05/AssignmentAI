import { style, styleVariants } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const base = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: '0.375rem',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  width: '100%',
  maxWidth: '24rem',
  pointerEvents: 'auto',
});

const variants = styleVariants({
  info: {
    backgroundColor: vars.colors.info,
    color: '#ffffff',
  },
  success: {
    backgroundColor: vars.colors.success,
    color: '#ffffff',
  },
  warning: {
    backgroundColor: vars.colors.warning,
    color: '#ffffff',
  },
  error: {
    backgroundColor: vars.colors.error,
    color: '#ffffff',
  },
});

const container = style({
  position: 'fixed',
  bottom: vars.space.md,
  right: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  zIndex: 100,
  pointerEvents: 'none',
});

const title = style({
  fontWeight: '600',
  fontSize: vars.fontSizes.sm,
});

const description = style({
  fontSize: vars.fontSizes.sm,
});

const closeButton = style({
  position: 'absolute',
  top: vars.space.xs,
  right: vars.space.xs,
  padding: vars.space.xs,
  color: 'currentColor',
  opacity: 0.5,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
  ':hover': {
    opacity: 1,
  },
});

export const toast = {
  container,
  toast: recipe({
    base,
    variants: {
      variant: variants,
    },
    defaultVariants: {
      variant: 'info',
    },
  }),
  title,
  description,
  closeButton,
}; 