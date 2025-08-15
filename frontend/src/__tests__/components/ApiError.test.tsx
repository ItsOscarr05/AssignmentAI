import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../contexts/ToastContext';
import { fireEvent, render, screen } from '../../test/test-utils';
import { ApiError } from '../common/ApiError';

interface ApiErrorProps {
  error: any;
  title?: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
  'data-testid'?: string;
  icon?: 'error' | 'warning';
  severity?: 'error' | 'warning';
  code?: string;
  details?: Record<string, string[]>;
  actionText?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  messageClassName?: string;
  messageStyle?: React.CSSProperties;
  actionClassName?: string;
  actionStyle?: React.CSSProperties;
}

describe('ApiError', () => {
  const renderApiError = (props: Partial<ApiErrorProps> = {}) => {
    const defaultProps: ApiErrorProps = {
      error: 'Test error message',
      ...props,
    };
    return render(
      <ToastProvider>
        <ApiError {...defaultProps} />
      </ToastProvider>
    );
  };

  it('renders error message with default props', () => {
    renderApiError();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByTestId('api-error-alert')).toBeInTheDocument();
  });

  it('renders with custom error code', () => {
    renderApiError({ code: 'TEST_ERROR' });
    expect(screen.getByText(/TEST_ERROR: Error/)).toBeInTheDocument();
  });

  it('renders with custom error details', () => {
    const details = { email: ['Invalid email format'] };
    renderApiError({ details });
    expect(screen.getByText(/email: Invalid email format/)).toBeInTheDocument();
  });

  it('renders with custom error icon', () => {
    renderApiError({ icon: 'warning' });
    expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
  });

  it('renders with custom error severity', () => {
    renderApiError({ severity: 'warning' });
    const alert = screen.getByTestId('api-error-alert');
    expect(alert).toHaveStyle({
      backgroundColor: 'rgba(255, 244, 229)',
      borderColor: 'rgb(255, 152, 0)',
    });
  });

  it('renders with custom error action', () => {
    const onRetry = vi.fn();
    renderApiError({ onRetry });
    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders with custom error action text', () => {
    renderApiError({ onRetry: vi.fn(), actionText: 'Try Again' });
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders with custom error className', () => {
    renderApiError({ className: 'custom-error' });
    expect(screen.getByTestId('api-error-alert')).toHaveClass('custom-error');
  });

  it('renders with custom error style', () => {
    renderApiError({ style: { margin: '20px' } });
    expect(screen.getByTestId('api-error-alert')).toHaveStyle({ margin: '20px' });
  });

  it('renders with custom error container className', () => {
    renderApiError({
      containerClassName: 'custom-container',
    });
    const container = screen.getByTestId('api-error-alert').parentElement;
    expect(container).toHaveClass('custom-container');
  });

  it('renders with custom error container style', () => {
    renderApiError({
      containerStyle: { padding: '10px' },
    });
    const container = screen.getByTestId('api-error-alert').parentElement;
    expect(container).toHaveStyle({ padding: '10px' });
  });

  it('renders with custom error icon className', () => {
    renderApiError({ iconClassName: 'custom-icon' });
    expect(screen.getByTestId('ErrorIcon')).toHaveClass('custom-icon');
  });

  it('renders with custom error icon style', () => {
    renderApiError({ iconStyle: { color: 'rgb(255, 0, 0)' } });
    expect(screen.getByTestId('ErrorIcon')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom error message className', () => {
    renderApiError({
      messageClassName: 'custom-message',
    });
    expect(screen.getByText('Test error message')).toHaveClass('custom-message');
  });

  it('renders with custom error message style', () => {
    renderApiError({ messageStyle: { color: 'rgb(255, 0, 0)' } });
    expect(screen.getByText('Test error message')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom error action className', () => {
    renderApiError({
      onRetry: vi.fn(),
      actionClassName: 'custom-action',
    });
    expect(screen.getByText(/retry/i)).toHaveClass('custom-action');
  });

  it('renders with custom error action style', () => {
    renderApiError({
      onRetry: vi.fn(),
      actionStyle: { color: 'rgb(255, 0, 0)' },
    });
    expect(screen.getByText(/retry/i)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom error aria-label', () => {
    renderApiError({ 'aria-label': 'Custom error' });
    expect(screen.getByTestId('api-error-alert')).toHaveAttribute('aria-label', 'Custom error');
  });

  it('renders with custom error aria-describedby', () => {
    renderApiError({
      'aria-describedby': 'custom-description',
    });
    expect(screen.getByTestId('api-error-alert')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('custom-description')
    );
  });

  it('renders with custom error role', () => {
    renderApiError({ role: 'status' });
    expect(screen.getByTestId('api-error-alert')).toHaveAttribute('role', 'status');
  });

  it('renders with custom error tabIndex', () => {
    renderApiError({ tabIndex: 0 });
    expect(screen.getByTestId('api-error-alert')).toHaveAttribute('tabIndex', '0');
  });

  it('renders with custom error data-testid', () => {
    renderApiError({ 'data-testid': 'custom-error' });
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
  });

  it('handles multiple error details', () => {
    const details = {
      email: ['Invalid email format'],
      password: ['Password is required'],
    };
    renderApiError({ details });
    expect(screen.getByText(/email: Invalid email format/)).toBeInTheDocument();
    expect(screen.getByText(/password: Password is required/)).toBeInTheDocument();
  });

  it('handles error with no action', () => {
    renderApiError();
    expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
  });

  it('handles error with no details', () => {
    renderApiError();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('handles error with no code', () => {
    renderApiError();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('handles network error', () => {
    const error = { message: 'Network Error' };
    renderApiError({ error });
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('handles API response error', () => {
    const error = {
      response: {
        data: {
          message: 'API Error',
          errors: {
            field: ['Error message'],
          },
        },
      },
    };
    renderApiError({ error });
    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText(/field: Error message/)).toBeInTheDocument();
  });

  it('handles unexpected error format', () => {
    const error = { unexpected: 'format' };
    renderApiError({ error });
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});
