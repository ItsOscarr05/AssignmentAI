import { style, styleVariants } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

const label = style({
  fontSize: vars.fontSizes.sm,
  fontWeight: '500',
  color: vars.colors.text,
});

const helperText = style({
  fontSize: vars.fontSizes.xs,
  color: vars.colors.text,
});

const inputBase = style({
  width: '100%',
  borderRadius: '0.375rem',
  border: `1px solid ${vars.colors.surface}`,
  backgroundColor: 'transparent',
  transition: 'all 150ms ease',
  color: vars.colors.text,
  '::placeholder': {
    color: vars.colors.text,
    opacity: 0.5,
  },
  ':focus': {
    outline: 'none',
    borderColor: vars.colors.primary,
    boxShadow: `0 0 0 1px ${vars.colors.primary}`,
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
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

const states = styleVariants({
  error: {
    borderColor: vars.colors.error,
    ':focus': {
      borderColor: vars.colors.error,
      boxShadow: `0 0 0 1px ${vars.colors.error}`,
    },
  },
  success: {
    borderColor: vars.colors.success,
    ':focus': {
      borderColor: vars.colors.success,
      boxShadow: `0 0 0 1px ${vars.colors.success}`,
    },
  },
});

export const textField = {
  container,
  label,
  helperText,
  input: recipe({
    base: inputBase,
    variants: {
      size: sizes,
      state: states,
    },
    defaultVariants: {
      size: 'md',
    },
  }),
}; 