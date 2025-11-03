import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../../components/layout/Navbar';
import { theme } from '../../theme';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    AppBar: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    Toolbar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    IconButton: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Avatar: ({ src, alt, children, ...props }: any) => (
      <div {...props}>{src ? <img src={src} alt={alt} /> : children}</div>
    ),
    Menu: ({ children, open, anchorEl, onClose, ...props }: any) =>
      open ? (
        <div role="menu" {...props}>
          {children}
        </div>
      ) : null,
    MenuItem: ({ children, onClick, ...props }: any) => (
      <div role="menuitem" onClick={onClick} {...props}>
        {children}
      </div>
    ),
    MenuList: ({ children, ...props }: any) => (
      <div role="menu" {...props}>
        {children}
      </div>
    ),
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Divider: (props: any) => <hr {...props} />,
    Badge: ({ children, badgeContent, ...props }: any) => (
      <div {...props}>
        {children}
        {badgeContent && <span data-testid="badge">{badgeContent}</span>}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Tooltip: ({ children, title, ...props }: any) => (
      <div {...props} title={title}>
        {children}
      </div>
    ),
  };
});

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Menu: () => <span aria-label="menu">Menu</span>,

  Settings: () => <span aria-label="settings">Settings</span>,
  AccountCircle: () => <span aria-label="account settings">Account</span>,
}));

// Mock LanguageSelector component
vi.mock('../LanguageSelector', () => ({
  default: () => <div data-testid="language-selector">Language Selector</div>,
}));

// Mock useAuth hook
let mockLogout = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      role: 'teacher',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true,
    },
    logout: () => mockLogout(),
    isAuthenticated: true,
  }),
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Navbar />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('renders navbar with all required elements', () => {
    renderNavbar();
    expect(screen.getByText(/assignmentai/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /menu/i })).toBeTruthy();

    expect(screen.getByRole('button', { name: /^settings$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /account settings/i })).toBeTruthy();
  });

  it('displays user information correctly', () => {
    renderNavbar();
    expect(screen.getByText('John Doe')).toBeTruthy();
    const avatar = screen.getByAltText('John Doe');
    expect(avatar.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('opens profile menu when account button is clicked', async () => {
    renderNavbar();
    const accountButton = screen.getByRole('button', { name: /account settings/i });
    fireEvent.click(accountButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: /profile/i })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeTruthy();
      expect(screen.getByRole('menuitem', { name: /logout/i })).toBeTruthy();
    });
  });

  it('handles logout when logout menu item is clicked', async () => {
    mockLogout = vi.fn(); // reset for this test
    renderNavbar();
    const accountButton = screen.getByRole('button', { name: /account settings/i });
    fireEvent.click(accountButton);

    await waitFor(() => {
      const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
