import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
});

const container = style({
  position: 'relative',
  width: '90%',
  maxWidth: '32rem',
  maxHeight: 'calc(100vh - 2rem)',
  backgroundColor: vars.colors.background,
  borderRadius: '0.5rem',
  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

const header = style({
  padding: vars.space.md,
  borderBottom: `1px solid ${vars.colors.surface}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const title = style({
  fontSize: vars.fontSizes.lg,
  fontWeight: '600',
  color: vars.colors.text,
});

const closeButton = style({
  padding: vars.space.xs,
  borderRadius: '0.375rem',
  color: vars.colors.text,
  opacity: 0.5,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
  ':hover': {
    opacity: 1,
  },
});

const body = style({
  padding: vars.space.md,
  overflowY: 'auto',
});

const footer = style({
  padding: vars.space.md,
  borderTop: `1px solid ${vars.colors.surface}`,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
});

export const modal = {
  overlay,
  container,
  header,
  title,
  closeButton,
  body,
  footer,
}; 