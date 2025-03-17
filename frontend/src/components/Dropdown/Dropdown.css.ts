import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  cursor: 'pointer',
});

const content = style({
  position: 'absolute',
  backgroundColor: vars.colors.background,
  borderRadius: '0.375rem',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  border: `1px solid ${vars.colors.surface}`,
  padding: vars.space.xs,
  minWidth: '12rem',
  zIndex: 50,
});

const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.fontSizes.sm,
  color: vars.colors.text,
  cursor: 'pointer',
  borderRadius: '0.25rem',
  transition: 'background-color 150ms ease',
  ':hover': {
    backgroundColor: vars.colors.surface,
  },
  ':focus': {
    backgroundColor: vars.colors.surface,
    outline: 'none',
  },
});

const separator = style({
  height: '1px',
  backgroundColor: vars.colors.surface,
  margin: vars.space.xs,
});

export const dropdown = {
  trigger,
  content,
  item,
  separator,
}; 