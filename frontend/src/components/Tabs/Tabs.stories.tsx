import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultTabs = [
  {
    id: 'account',
    label: 'Account',
    content: (
      <div>
        <h3>Account Settings</h3>
        <p>Manage your account settings and preferences here.</p>
      </div>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    content: (
      <div>
        <h3>Security Settings</h3>
        <p>Configure your security preferences and two-factor authentication.</p>
      </div>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    content: (
      <div>
        <h3>Notification Preferences</h3>
        <p>Choose how you want to be notified about important updates.</p>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    tabs: defaultTabs,
  },
};

export const WithDefaultTab: Story = {
  args: {
    tabs: defaultTabs,
    defaultTab: 'security',
  },
};

export const WithOnChange: Story = {
  args: {
    tabs: defaultTabs,
    onChange: (tabId) => console.log(`Tab changed to: ${tabId}`),
  },
};

export const SingleTab: Story = {
  args: {
    tabs: [defaultTabs[0]],
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      ...defaultTabs,
      {
        id: 'privacy',
        label: 'Privacy',
        content: <div>Privacy settings and controls</div>,
      },
      {
        id: 'billing',
        label: 'Billing',
        content: <div>Billing information and payment methods</div>,
      },
      {
        id: 'api',
        label: 'API',
        content: <div>API keys and documentation</div>,
      },
    ],
  },
}; 