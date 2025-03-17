import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const list = style({
  display: 'flex',
  gap: vars.space.md,
  borderBottom: `1px solid ${vars.colors.surface}`,
});

const trigger = recipe({
  base: {
    padding: `${vars.space.sm} ${vars.space.md}`,
    color: vars.colors.text,
    fontSize: vars.fontSizes.sm,
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 150ms ease',
    ':hover': {
      color: vars.colors.primary,
    },
  },
  variants: {
    selected: {
      true: {
        color: vars.colors.primary,
        borderBottomColor: vars.colors.primary,
      },
    },
  },
});

const content = style({
  padding: vars.space.md,
});

export const tabs = {
  list,
  trigger,
  content,
}; 