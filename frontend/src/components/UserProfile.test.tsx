import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '../test/test-utils';
import UserProfile from './UserProfile';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  CircularProgress: () => <div role="progressbar" data-testid="loading-spinner" />,
  TextField: ({ label, value, onChange, type, ...props }: any) => (
    <input type={type || 'text'} value={value} onChange={onChange} aria-label={label} {...props} />
  ),
  Typography: ({ children, color, ...props }: any) => (
    <div data-color={color} {...props}>
      {children}
    </div>
  ),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'student',
  is_active: true,
  is_verified: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('UserProfile Component', () => {
  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />);

    expect(screen.getByText(mockUser.full_name)).toBeInTheDocument();
    expect(screen.getByText(`Email: ${mockUser.email}`)).toBeInTheDocument();
    expect(screen.getByText(`Role: ${mockUser.role}`)).toBeInTheDocument();
    expect(screen.getByText('Status: Not Verified')).toBeInTheDocument();
  });

  it('handles profile updates', async () => {
    const mockOnUpdate = vi.fn();
    render(<UserProfile user={mockUser} onUpdate={mockOnUpdate} />);

    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));

    // Update name
    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockOnUpdate).toHaveBeenCalledWith({ full_name: 'New Name' });
  });

  it('handles password changes', () => {
    const mockOnPasswordChange = vi.fn();
    render(<UserProfile user={mockUser} onPasswordChange={mockOnPasswordChange} />);

    // Fill in password fields
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'current123' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'new123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'new123' },
    });

    // Submit password change
    fireEvent.click(screen.getByText('Update Password'));

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      current_password: 'current123',
      new_password: 'new123',
    });
  });

  it('shows loading state', () => {
    render(<UserProfile user={mockUser} isLoading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'An error occurred';
    render(<UserProfile user={mockUser} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
