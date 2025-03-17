import type { Meta, StoryObj } from '@storybook/react';
import SkeletonLoader from './SkeletonLoader';
import { ThemeProvider } from '@mui/material/styles';
import { createAccessibleTheme } from '../theme';

const meta: Meta<typeof SkeletonLoader> = {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
  decorators: [
    (Story) => (
      <ThemeProvider theme={createAccessibleTheme({})}>
        <Story />
      </ThemeProvider>
    ),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonLoader>;

export const Default: Story = {
  args: {
    rows: 3,
    height: 60,
    width: '100%',
    variant: 'rectangular',
    spacing: 2,
  },
};

export const Text: Story = {
  args: {
    rows: 5,
    height: 20,
    variant: 'text',
    spacing: 1,
  },
};

export const Circular: Story = {
  args: {
    rows: 1,
    height: 100,
    width: 100,
    variant: 'circular',
  },
}; 