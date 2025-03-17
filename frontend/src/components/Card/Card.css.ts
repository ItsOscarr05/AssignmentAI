import { style, styleVariants } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

const base = style({
  backgroundColor: vars.colors.surface,
  borderRadius: '0.5rem',
  overflow: 'hidden',
  transition: 'all 150ms ease',
});

const variants = styleVariants({
  elevated: {
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    ':hover': {
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
  },
  outlined: {
    border: `1px solid ${vars.colors.surface}`,
  },
  flat: {},
});

const header = style({
  padding: vars.space.md,
  borderBottom: `1px solid ${vars.colors.surface}`,
});

const body = style({
  padding: vars.space.md,
});

const footer = style({
  padding: vars.space.md,
  borderTop: `1px solid ${vars.colors.surface}`,
});

export const card = {
  container: recipe({
    base,
    variants: {
      variant: variants,
    },
    defaultVariants: {
      variant: 'elevated',
    },
  }),
  header,
  body,
  footer,
}; 