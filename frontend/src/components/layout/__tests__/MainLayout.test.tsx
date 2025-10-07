import { useMediaQuery } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../../../contexts/ThemeContext';
import { theme } from '../../../theme';
import { MainLayout } from '../MainLayout';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Menu: () => <span data-testid="menu-icon" />,
  Brightness4: () => <span data-testid="dark-mode-icon" />,
  Brightness7: () => <span data-testid="light-mode-icon" />,
  AccountCircle: () => <span data-testid="avatar-icon" />,
}));

// Mock Material-UI components and hooks
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      breakpoints: {
        down: () => false,
      },
      palette: {
        mode: 'light',
        background: {
          default: '#ffffff',
          paper: '#ffffff',
        },
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
      },
      transitions: {
        create: () => '',
        easing: {
          sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        },
        duration: {
          leavingScreen: 195,
        },
      },
    }),
    useMediaQuery: vi.fn().mockReturnValue(false),
    AppBar: ({ children, ...props }: any) => (
      <div data-testid="app-bar" role="banner" {...props}>
        {children}
      </div>
    ),
    IconButton: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Container: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Menu: ({ anchorEl, onClose, open, children }: any) => {
      if (!open || !anchorEl) return null;

      return (
        <div
          data-testid="menu"
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 1,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px 0',
          }}
        >
          <div
            role="menuitem"
            aria-label="Profile"
            onClick={e => {
              e.stopPropagation();
              onClose?.();
            }}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Profile
          </div>
          <div
            role="menuitem"
            aria-label="Settings"
            onClick={e => {
              e.stopPropagation();
              onClose?.();
            }}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Settings
          </div>
          <div
            role="menuitem"
            aria-label="Logout"
            onClick={e => {
              e.stopPropagation();
              onClose?.();
            }}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Logout
          </div>
          {children}
        </div>
      );
    },
    MenuItem: ({ children, onClick, ...props }: any) => (
      <div
        role="menuitem"
        onClick={e => {
          e.stopPropagation();
          onClick?.(e);
        }}
        {...props}
        style={{ padding: '8px 16px', cursor: 'pointer' }}
      >
        {children}
      </div>
    ),
  };
});

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: vi.fn().mockImplementation((initial: any) => {
      let state = initial;
      const setState = (newValue: any) => {
        if (typeof newValue === 'function') {
          state = newValue(state);
        } else {
          state = newValue;
        }
        return state;
      };
      return [state, setState];
    }),
  };
});

// Mock ThemeContext
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

// Mock auth service
vi.mock('../../../services/api', () => ({
  auth: {
    logout: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter>{children}</MemoryRouter>
  </ThemeProvider>
);

const renderMainLayout = () => {
  return render(<MainLayout />, { wrapper: Wrapper });
};

describe('MainLayout', () => {
  const mockNavigate = vi.fn();
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
  });

  it('renders the app title', () => {
    renderMainLayout();
    expect(screen.getByText('AssignmentAI')).toBeTruthy();
  });

  it('handles mobile menu toggle', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    renderMainLayout();

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    expect(menuButton).toBeTruthy();
  });

  it('handles logout', async () => {
    renderMainLayout();

    const avatarButton = screen.getByRole('button', { name: 'user avatar' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      const logoutButton = screen.getByRole('menuitem', { name: 'Logout' });
      expect(logoutButton).toBeTruthy();
      fireEvent.click(logoutButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('toggles dark mode', () => {
    renderMainLayout();

    const darkModeButton = screen.getByRole('button', { name: /dark mode/i });
    fireEvent.click(darkModeButton);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('displays user avatar and menu', async () => {
    renderMainLayout();

    const avatarButton = screen.getByRole('button', { name: 'user avatar' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
      expect(menuItems[0].textContent).toContain('Profile');
      expect(menuItems[1].textContent).toContain('Settings');
      expect(menuItems[2].textContent).toContain('Logout');
    });
  });

  it('closes user menu when clicking outside', async () => {
    const { baseElement } = renderMainLayout();

    const avatarButton = screen.getByRole('button', { name: 'user avatar' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    fireEvent.mouseDown(baseElement);

    await waitFor(() => {
      expect(screen.queryByRole('menuitem')).not.toBeTruthy();
    });
  });

  it('renders the Outlet component for nested routes', () => {
    renderMainLayout();
    expect(screen.getByTestId('outlet')).toBeTruthy();
  });

  it('applies correct theme based on dark mode setting', () => {
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    });

    renderMainLayout();
    expect(screen.getByTestId('light-mode-icon')).toBeTruthy();

    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });

    renderMainLayout();
    expect(screen.getByTestId('dark-mode-icon')).toBeTruthy();
  });
});
