import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, color, variant, size, className, style, ...props }: any) => (
      <button
        className={`MuiButton-root ${
          color ? `MuiButton-color${color.charAt(0).toUpperCase() + color.slice(1)}` : ''
        } ${variant ? `MuiButton-${variant}` : ''} ${
          size ? `MuiButton-size${size.charAt(0).toUpperCase() + size.slice(1)}` : ''
        } ${className || ''}`}
        style={style}
        {...props}
      >
        {children}
      </button>
    ),
    IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Dialog: ({
      children,
      className,
      style,
      role,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      tabIndex,
      'data-testid': dataTestId,
      onClose,
      dialogClassName,
      dialogStyle,
      ...props
    }: any) => {
      const mergedClassName = `MuiDialog-root ${dialogClassName || className || ''}`.trim();
      const mergedStyle = { ...style, ...dialogStyle };
      const mergedProps = {
        role: role || 'dialog',
        className: mergedClassName,
        style: mergedStyle,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedby,
        tabIndex: tabIndex,
        'data-testid': dataTestId || 'dialog',
        onKeyDown: (e: any) => {
          if (e.key === 'Escape' && onClose) {
            onClose(e, 'escapeKeyDown');
          }
        },
        onClick: (e: any) => {
          if (e.target === e.currentTarget && onClose) {
            onClose(e, 'backdropClick');
          }
        },
        ...props,
      };

      return <div {...mergedProps}>{children}</div>;
    },
    DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    DialogActions: ({ children, ...props }: any) => (
      <div role="group" {...props}>
        {children}
      </div>
    ),
    List: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    ListItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    ListItemIcon: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ListItemText: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Divider: (props: any) => <hr {...props} />,
    Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CircularProgress: (props: any) => <div role="progressbar" {...props} />,
    CssBaseline: () => null,
  };
});

describe('ConfirmationDialog', () => {
  const renderConfirmationDialog = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <ConfirmationDialog
          open={true}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
          title="Test Dialog"
          message="Test Message"
          {...props}
        />
      </ThemeProvider>
    );
  };

  it('renders dialog with default props', () => {
    renderConfirmationDialog();

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    renderConfirmationDialog({ title: 'Custom Title' });

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderConfirmationDialog({ message: 'Custom message' });

    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('renders with custom confirm text', () => {
    renderConfirmationDialog({ confirmText: 'Delete' });

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders with custom cancel text', () => {
    renderConfirmationDialog({ cancelText: 'Go Back' });

    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('renders with custom confirm color', () => {
    renderConfirmationDialog({ confirmColor: 'error' });

    expect(screen.getByText(/confirm/i)).toHaveClass('MuiButton-colorError');
  });

  it('renders with custom cancel color', () => {
    renderConfirmationDialog({ cancelColor: 'primary' });

    expect(screen.getByText(/cancel/i)).toHaveClass('MuiButton-colorPrimary');
  });

  it('renders with custom confirm variant', () => {
    renderConfirmationDialog({ confirmVariant: 'outlined' });

    expect(screen.getByText(/confirm/i)).toHaveClass('MuiButton-outlined');
  });

  it('renders with custom cancel variant', () => {
    renderConfirmationDialog({ cancelVariant: 'contained' });

    expect(screen.getByText(/cancel/i)).toHaveClass('MuiButton-contained');
  });

  it('renders with custom confirm size', () => {
    renderConfirmationDialog({ confirmSize: 'large' });

    expect(screen.getByText(/confirm/i)).toHaveClass('MuiButton-sizeLarge');
  });

  it('renders with custom cancel size', () => {
    renderConfirmationDialog({ cancelSize: 'small' });

    expect(screen.getByText(/cancel/i)).toHaveClass('MuiButton-sizeSmall');
  });

  it('renders with custom confirm icon', () => {
    renderConfirmationDialog({ confirmIcon: 'delete' });

    expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
  });

  it('renders with custom cancel icon', () => {
    renderConfirmationDialog({ cancelIcon: 'arrow_back' });

    expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
  });

  it('renders with custom confirm className', () => {
    renderConfirmationDialog({ confirmClassName: 'custom-confirm' });

    expect(screen.getByText(/confirm/i)).toHaveClass('custom-confirm');
  });

  it('renders with custom cancel className', () => {
    renderConfirmationDialog({ cancelClassName: 'custom-cancel' });

    expect(screen.getByText(/cancel/i)).toHaveClass('custom-cancel');
  });

  it('renders with custom confirm style', () => {
    renderConfirmationDialog({ confirmStyle: { margin: '20px' } });

    expect(screen.getByText(/confirm/i)).toHaveStyle({ margin: '20px' });
  });

  it('renders with custom cancel style', () => {
    renderConfirmationDialog({ cancelStyle: { margin: '20px' } });

    expect(screen.getByText(/cancel/i)).toHaveStyle({ margin: '20px' });
  });

  it('renders with custom dialog className', () => {
    renderConfirmationDialog({ dialogClassName: 'custom-dialog' });

    expect(screen.getByRole('dialog')).toHaveClass('custom-dialog');
  });

  it('renders with custom dialog style', () => {
    renderConfirmationDialog({ dialogStyle: { padding: '20px' } });

    expect(screen.getByRole('dialog')).toHaveStyle({ padding: '20px' });
  });

  it('renders with custom title className', () => {
    renderConfirmationDialog({ titleClassName: 'custom-title' });

    expect(screen.getByText('Test Dialog')).toHaveClass('custom-title');
  });

  it('renders with custom title style', () => {
    renderConfirmationDialog({ titleStyle: { color: 'red' } });

    expect(screen.getByText('Test Dialog')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom message className', () => {
    renderConfirmationDialog({ messageClassName: 'custom-message' });

    expect(screen.getByText('Test Message')).toHaveClass('custom-message');
  });

  it('renders with custom message style', () => {
    renderConfirmationDialog({ messageStyle: { color: 'red' } });

    expect(screen.getByText('Test Message')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom actions className', () => {
    renderConfirmationDialog({ actionsClassName: 'custom-actions' });

    expect(screen.getByRole('group')).toHaveClass('custom-actions');
  });

  it('renders with custom actions style', () => {
    renderConfirmationDialog({ actionsStyle: { padding: '10px' } });

    expect(screen.getByRole('group')).toHaveStyle({ padding: '10px' });
  });

  it('renders with custom aria-label', () => {
    renderConfirmationDialog({ 'aria-label': 'Custom dialog' });

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Custom dialog');
  });

  it('renders with custom aria-describedby', () => {
    renderConfirmationDialog({ 'aria-describedby': 'custom-description' });

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'custom-description');
  });

  it('renders with custom role', () => {
    renderConfirmationDialog({ role: 'alertdialog' });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('renders with custom tabIndex', () => {
    renderConfirmationDialog({ tabIndex: 0 });

    expect(screen.getByRole('dialog')).toHaveAttribute('tabIndex', '0');
  });

  it('renders with custom data-testid', () => {
    renderConfirmationDialog({ 'data-testid': 'custom-dialog' });

    expect(screen.getByTestId('custom-dialog')).toBeInTheDocument();
  });

  it('handles confirm button click', () => {
    const onConfirm = vi.fn();
    renderConfirmationDialog({ onConfirm });

    const confirmButton = screen.getByText(/confirm/i);
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    const onCancel = vi.fn();
    renderConfirmationDialog({ onCancel });

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles dialog close', () => {
    const onCancel = vi.fn();
    renderConfirmationDialog({ onCancel });

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles escape key press', () => {
    const onCancel = vi.fn();
    renderConfirmationDialog({ onCancel });

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles confirm button disabled state', () => {
    renderConfirmationDialog({ confirmDisabled: true });

    expect(screen.getByText(/confirm/i)).toBeDisabled();
  });

  it('handles cancel button disabled state', () => {
    renderConfirmationDialog({ cancelDisabled: true });

    expect(screen.getByText(/cancel/i)).toBeDisabled();
  });

  it('handles confirm button loading state', () => {
    renderConfirmationDialog({ confirmLoading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles cancel button loading state', () => {
    renderConfirmationDialog({ cancelLoading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles dialog with no title', () => {
    renderConfirmationDialog({ title: undefined });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('handles dialog with no message', () => {
    renderConfirmationDialog({ message: undefined });

    expect(screen.queryByText(/message/i)).not.toBeInTheDocument();
  });

  it('handles dialog with no confirm button', () => {
    renderConfirmationDialog({ showConfirm: false });

    expect(screen.queryByText(/confirm/i)).not.toBeInTheDocument();
  });

  it('handles dialog with no cancel button', () => {
    renderConfirmationDialog({ showCancel: false });

    expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
  });
});
