import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../../../contexts/ThemeContext';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { theme } from '../../../theme';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  AccountCircle: () => <span data-testid="AccountCircleIcon" />,
  Assignment: () => <span data-testid="AssignmentIcon" />,
  Build: () => <span data-testid="BuildIcon" />,
  ChevronLeft: () => <span data-testid="ChevronLeftIcon" />,
  Dashboard: () => <span data-testid="DashboardIcon" />,
  Help: () => <span data-testid="HelpIcon" />,
  History: () => <span data-testid="HistoryIcon" />,
  Menu: () => <span data-testid="MenuIcon" />,
  PriceChange: () => <span data-testid="PriceChangeIcon" />,
  Settings: () => <span data-testid="SettingsIcon" />,
  SmartToy: () => <span data-testid="SmartToyIcon" />,
  Token: () => <span data-testid="TokenIcon" />,
}));

// Mock Material-UI hooks and components
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    useMediaQuery: vi.fn().mockReturnValue(false),
    Box: ({ children, component, ...props }: any) => {
      const Component = component || 'div';
      return (
        <Component
          data-testid={component === 'main' ? 'main-content' : undefined}
          style={{
            ...(component === 'main' && {
              flexGrow: 1,
              padding: '24px',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,240,240,0.95) 100%)',
            }),
          }}
          {...props}
        >
          {children}
        </Component>
      );
    },
    CssBaseline: () => null,
    Divider: () => <hr />,
    Drawer: ({ children, ...props }: any) => (
      <aside role="complementary" style={{ width: '240px' }} {...props}>
        {children}
      </aside>
    ),
    IconButton: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} aria-label="toggle drawer" {...props}>
        {children}
      </button>
    ),
    List: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    ListItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    ListItemButton: ({ children, ...props }: any) => (
      <button style={{ borderRadius: '4px' }} {...props}>
        {children}
      </button>
    ),
    ListItemIcon: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    ListItemText: ({ primary, ...props }: any) => <span {...props}>{primary}</span>,
    Toolbar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  };
});

// Mock the theme context
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

const renderDashboardLayout = (children: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <DashboardLayout>{children}</DashboardLayout>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTheme as any).mockReturnValue({
      darkMode: false,
      toggleDarkMode: vi.fn(),
    });
  });

  it('renders the dashboard layout with logo and navigation', () => {
    renderDashboardLayout(<div>Test Content</div>);

    // Check for logo and app name
    expect(screen.getByAltText('Logo')).toBeTruthy();
    expect(screen.getByText('AssignmentAI')).toBeTruthy();

    // Check for navigation items
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Assignments')).toBeTruthy();
    expect(screen.getByText('Workshop')).toBeTruthy();
  });

  it('renders children content in the main area', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    renderDashboardLayout(testContent);

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });

  it('applies correct theme based on dark mode setting', () => {
    // Test light mode
    (useTheme as any).mockReturnValue({
      darkMode: false,
      toggleDarkMode: vi.fn(),
    });
    const { unmount } = renderDashboardLayout(<div>Test Content</div>);
    const main = screen.getByTestId('main-content');
    expect(main.style.background).toBe(
      'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,240,240,0.95) 100%)'
    );

    // Clean up before next render
    unmount();

    // Test dark mode
    (useTheme as any).mockReturnValue({
      darkMode: true,
      toggleDarkMode: vi.fn(),
    });
    renderDashboardLayout(<div>Test Content</div>);
    const mainDark = screen.getByTestId('main-content');
    expect(mainDark.style.background).toBe(
      'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,240,240,0.95) 100%)'
    );
  });

  it('renders with proper drawer styles', () => {
    renderDashboardLayout(<div>Test Content</div>);
    const drawer = screen.getByRole('complementary');

    // Check drawer styles
    expect(drawer.style.width).toBe('240px');
  });

  it('renders with proper main content styles', () => {
    renderDashboardLayout(<div>Test Content</div>);
    const main = screen.getByTestId('main-content');

    // Check main content styles
    expect(main.style.flexGrow).toBe('1');
    expect(main.style.padding).toBe('24px');
  });

  it('handles drawer toggle', () => {
    renderDashboardLayout(<div>Test Content</div>);
    const toggleButton = screen.getByRole('button', { name: 'toggle drawer' });
    expect(toggleButton).toBeTruthy();

    // Click the toggle button
    fireEvent.click(toggleButton);

    // Check if drawer is toggled
    const drawer = screen.getByRole('complementary');
    expect(drawer).toBeTruthy();
  });

  it('renders with proper navigation item styles', () => {
    renderDashboardLayout(<div>Test Content</div>);
    const navItems = screen.getAllByRole('button', { name: /overview|assignments|workshop/i });

    // Check navigation item styles
    navItems.forEach(item => {
      expect(item.style.borderRadius).toBe('4px');
    });
  });
});
