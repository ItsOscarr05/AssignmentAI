import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../contexts/ToastContext';
import { theme } from '../../../theme';
import UserProfile from '../UserProfile';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Assignment: () => <div data-testid="assignment-icon" />,
  Apartment: () => <div data-testid="apartment-icon" />,
  Description: () => <div data-testid="description-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Feedback: () => <div data-testid="feedback-icon" />,
  Grade: () => <div data-testid="grade-icon" />,
  Login: () => <div data-testid="login-icon" />,
  Save: () => <div data-testid="save-icon" />,
  School: () => <div data-testid="school-icon" />,
  CloudUpload: () => <div data-testid="cloud-upload-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Close: () => <div data-testid="close-icon" />,
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  };
});

// Mock URL.createObjectURL
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'mock-url'),
});

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Alert: ({
    children,
    severity,
    onClose,
  }: {
    children: React.ReactNode;
    severity: string;
    onClose?: () => void;
  }) => (
    <div data-testid="alert" role="alert" data-severity={severity} onClick={onClose}>
      {children}
    </div>
  ),
  Avatar: ({ src, sx }: { src: string; sx: any }) => <div data-testid="avatar" src={src} sx={sx} />,
  Box: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div {...props}>{children}</div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    startIcon,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    startIcon?: React.ReactNode;
  }) => (
    <button
      className={`MuiButton-root MuiButton-contained ${disabled ? 'Mui-disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      starticon={startIcon}
      variant="contained"
    >
      {children}
    </button>
  ),
  Chip: ({ label, color, sx }: { label: string; color: string; sx: any }) => (
    <div data-testid="chip" label={label} color={color} sx={sx} />
  ),
  CircularProgress: ({ size }: { size?: number }) => (
    <div data-testid="circular-progress" role="progressbar" size={size} />
  ),
  Grid: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div data-testid="grid" {...props}>
      {children}
    </div>
  ),
  List: ({ children }: { children: React.ReactNode }) => <ul data-testid="list">{children}</ul>,
  ListItem: ({ children }: { children: React.ReactNode }) => (
    <li data-testid="list-item">{children}</li>
  ),
  ListItemIcon: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="list-item-icon">{children}</div>
  ),
  ListItemText: ({
    primary,
    secondary,
  }: {
    primary: string | React.ReactNode;
    secondary?: string;
  }) => (
    <div data-testid="list-item-text">
      <div data-testid="primary">{primary}</div>
      {secondary && <div data-testid="secondary">{secondary}</div>}
    </div>
  ),
  Paper: ({ children, sx, variant }: { children: React.ReactNode; sx?: any; variant?: string }) => (
    <div sx={sx} variant={variant}>
      {children}
    </div>
  ),
  Snackbar: ({
    open,
    children,
    ...props
  }: {
    open: boolean;
    children: React.ReactNode;
    [key: string]: any;
  }) =>
    open ? (
      <div data-testid="snackbar" role="alert" {...props}>
        {children}
      </div>
    ) : null,
  TextField: ({
    value,
    onChange,
    label,
    placeholder,
    rows,
    sx,
    inputProps,
  }: {
    value: string;
    onChange: (event: any) => void;
    label: string;
    placeholder: string;
    rows?: number;
    sx?: any;
    inputProps?: any;
  }) => (
    <div>
      <input
        data-testid="text-field"
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
        rows={rows}
        sx={sx}
        inputprops={inputProps}
        type="text"
        aria-label={label}
      />
    </div>
  ),
  Typography: ({
    children,
    variant,
    color,
  }: {
    children: React.ReactNode;
    variant?: string;
    color?: string;
  }) => (
    <div data-testid="typography" variant={variant} color={color}>
      {children}
    </div>
  ),
  IconButton: ({
    children,
    onClick,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    size?: string;
  }) => (
    <button data-testid="icon-button" onClick={onClick} size={size}>
      {children}
    </button>
  ),
}));

// Mock ToastContext
vi.mock('../../../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">
      {children}
      <div data-testid="snackbar" role="alert" />
    </div>
  ),
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock user data
const mockUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'student',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  institution: 'Test University',
  department: 'Computer Science',
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLogin: '2024-01-02T00:00:00.000Z',
  statistics: {
    totalAssignments: 10,
    averageGrade: 85,
    submissionRate: 90,
    feedbackReceived: 5,
  },
  recentActivity: [
    {
      id: 1,
      type: 'submission',
      title: 'Assignment Submitted',
      description: 'Submitted Math Assignment',
      timestamp: '2024-01-02T00:00:00.000Z',
    },
  ],
};

describe('UserProfile', () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <ToastProvider>
            <UserProfile />
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock fetch implementation
    global.fetch = vi.fn().mockImplementation(url => {
      if (url === '/api/users/1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders user profile information correctly', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Wait for profile data to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Verify profile information is displayed
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.bio)).toBeInTheDocument();

    // Check for institution and department
    const listItems = screen.getAllByTestId('list-item-text');
    expect(listItems[0]).toHaveTextContent(mockUser.institution);
    expect(listItems[1]).toHaveTextContent(mockUser.department);

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
  });

  it('displays loading state while fetching data', async () => {
    // Override the mock for this test to add a delay
    global.fetch = vi.fn().mockImplementationOnce(url => {
      if (url === '/api/users/1') {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockUser),
            });
          }, 100);
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    // Override the mock for this test to simulate an error
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('Failed to fetch')));

    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });

    // Verify error toast is displayed
    await waitFor(() => {
      const errorToast = screen.getByTestId('snackbar');
      expect(errorToast).toBeInTheDocument();
    });
  });

  it('allows editing profile information', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Update profile information
    const firstNameInput = screen.getByLabelText('First Name');
    const bioInput = screen.getAllByTestId('text-field')[1];
    const institutionInput = screen.getAllByTestId('text-field')[2];
    const departmentInput = screen.getAllByTestId('text-field')[3];

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });
    fireEvent.change(institutionInput, { target: { value: 'New University' } });
    fireEvent.change(departmentInput, { target: { value: 'New Department' } });

    // Mock successful update response
    global.fetch = vi.fn().mockImplementationOnce((url, options) => {
      if (url === '/api/users/1' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockUser,
              firstName: 'Jane',
              bio: 'Updated bio',
              institution: 'New University',
              department: 'New Department',
            }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Verify fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        body: expect.any(FormData),
      });
    });
  });

  it('displays user statistics correctly', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    // Verify statistics are displayed
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // totalAssignments
    expect(screen.getByText('85%')).toBeInTheDocument(); // averageGrade
    expect(screen.getByText('90%')).toBeInTheDocument(); // submissionRate
    expect(screen.getByText('5')).toBeInTheDocument(); // feedbackReceived
  });

  it('displays recent activity correctly', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Verify activity is displayed
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();

    // Check for activity title and description
    const activityListItem = screen.getAllByTestId('list-item-text')[4];
    expect(activityListItem).toHaveTextContent(mockUser.recentActivity[0].title);
    expect(activityListItem).toHaveTextContent(mockUser.recentActivity[0].description);
  });

  it('handles successful profile updates', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Update profile information
    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Mock successful update response
    global.fetch = vi.fn().mockImplementationOnce((url, options) => {
      if (url === '/api/users/1' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockUser,
              firstName: 'Jane',
            }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('handles API errors during profile updates', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Update profile information
    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Mock failed update response
    global.fetch = vi.fn().mockImplementationOnce((url, options) => {
      if (url === '/api/users/1' && options?.method === 'PUT') {
        return Promise.reject(new Error('Failed to update'));
      }
      return Promise.reject(new Error('Not found'));
    });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });

  it('handles avatar upload', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button to enable avatar upload
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Create a file
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

    // Mock successful upload response
    global.fetch = vi.fn().mockImplementationOnce((url, options) => {
      if (url === '/api/users/1' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockUser,
              avatar: 'https://example.com/new-avatar.jpg',
            }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Find and click the upload button
    const uploadButton = screen.getByLabelText(/upload file/i);
    fireEvent.change(uploadButton, { target: { files: [file] } });

    // Click save button to submit the changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Verify fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        body: expect.any(FormData),
      });
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('validates avatar file type', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button to enable avatar upload
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Create an invalid file
    const file = new File(['avatar'], 'avatar.txt', { type: 'text/plain' });

    // Find and click the upload button
    const uploadButton = screen.getByLabelText(/upload file/i);
    fireEvent.change(uploadButton, { target: { files: [file] } });

    // Verify error message
    await waitFor(() => {
      const errorMessage = screen.getByTestId('alert');
      expect(errorMessage).toHaveTextContent('Invalid file type');
    });
  });

  it('validates avatar file size', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button to enable avatar upload
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Create a large file (11MB)
    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'avatar.jpg', { type: 'image/jpeg' });

    // Find and click the upload button
    const uploadButton = screen.getByLabelText(/upload file/i);
    fireEvent.change(uploadButton, { target: { files: [file] } });

    // Verify error message
    await waitFor(() => {
      const errorMessage = screen.getByTestId('alert');
      expect(errorMessage).toHaveTextContent('File size exceeds limit');
    });
  });

  it('disables save button during API calls', async () => {
    renderComponent();

    // Wait for loading to complete and profile to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Update profile information using test-id
    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Mock delayed response
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockImplementationOnce((url, options) => {
      if (url === '/api/users/1' && options?.method === 'PUT') {
        return delayedPromise.then(() => ({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockUser,
              firstName: 'Jane',
            }),
        }));
      }
      return Promise.reject(new Error('Not found'));
    });

    // Get save button and verify it's enabled before clicking
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();

    // Save changes
    fireEvent.click(saveButton);

    // Verify loading spinner appears
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the promise to complete the API call
    resolvePromise!({});

    // Wait for loading state to be cleared
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Wait for the edit button to reappear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    // Verify the edit button is enabled
    const editButtonAfterSave = screen.getByRole('button', { name: /edit profile/i });
    expect(editButtonAfterSave).not.toBeDisabled();
  });
});
