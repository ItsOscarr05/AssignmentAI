import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import DialogContainer from '../DialogContainer';

// Mock Material-UI components
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    Dialog: ({ children, ...props }: any) => (
      <div data-testid="dialog-container" role="dialog" {...props}>
        {children}
      </div>
    ),
    DialogContent: ({ children, ...props }: any) => (
      <div
        data-testid="dialog-content"
        style={{ padding: '16px', overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}
        {...props}
      >
        {children}
      </div>
    ),
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    IconButton: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} style={{ color: 'rgb(158, 158, 158)', padding: '8px' }} {...props}>
        {children}
      </button>
    ),
    Typography: ({ children, variant, ...props }: any) => {
      const styles = {
        h6: {
          margin: 0,
          color: 'rgb(26, 26, 26)',
          fontSize: '1.25rem',
          fontWeight: 700,
        },
        subtitle1: {
          marginTop: '8px',
          color: 'rgb(102, 102, 102)',
          fontSize: '1rem',
          fontWeight: 400,
        },
      };
      return (
        <div style={styles[variant as keyof typeof styles]} {...props}>
          {children}
        </div>
      );
    },
  };
});

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Close: () => <span data-testid="close-icon" />,
}));

const renderDialogContainer = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <DialogContainer open={true} onClose={vi.fn()} {...props}>
        <div>Test Content</div>
      </DialogContainer>
    </ThemeProvider>
  );
};

describe('DialogContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    renderDialogContainer();
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders with custom title', () => {
    renderDialogContainer({ title: 'Test Title' });
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('renders with custom subtitle', () => {
    renderDialogContainer({ subtitle: 'Test Subtitle' });
    expect(screen.getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders with custom actions', () => {
    const actions = <button>Test Action</button>;
    renderDialogContainer({ actions });
    expect(screen.getByText('Test Action')).toBeTruthy();
  });

  it('renders with custom max width', () => {
    renderDialogContainer({ maxWidth: 'md' });
    const dialog = screen.getByTestId('dialog-container');
    expect(dialog.getAttribute('maxWidth')).toBe('md');
  });

  it('renders with proper container styles', () => {
    renderDialogContainer();
    const dialog = screen.getByTestId('dialog-container');
    expect(dialog).toBeTruthy();
  });

  it('renders with proper header styles', () => {
    renderDialogContainer({ title: 'Test Title' });
    const header = screen.getByTestId('dialog-header');
    expect(header).toBeTruthy();
  });

  it('renders with proper title styles', () => {
    renderDialogContainer({ title: 'Test Title' });
    const title = screen.getByText('Test Title');
    expect(title.style.margin).toBe('0px');
    expect(title.style.color).toBe('rgb(26, 26, 26)');
    expect(title.style.fontSize).toBe('1.25rem');
    expect(title.style.fontWeight).toBe('700');
  });

  it('renders with proper subtitle styles', () => {
    renderDialogContainer({ subtitle: 'Test Subtitle' });
    const subtitle = screen.getByText('Test Subtitle');
    expect(subtitle.style.marginTop).toBe('8px');
    expect(subtitle.style.color).toBe('rgb(102, 102, 102)');
    expect(subtitle.style.fontSize).toBe('1rem');
    expect(subtitle.style.fontWeight).toBe('400');
  });

  it('renders with proper content styles', () => {
    renderDialogContainer();
    const content = screen.getByTestId('dialog-content');
    expect(content.style.padding).toBe('16px');
    expect(content.style.overflow).toBe('auto');
    expect(content.style.maxHeight).toBe('calc(100vh - 64px)');
  });

  it('renders with proper typography styles', () => {
    renderDialogContainer({ title: 'Test Title', subtitle: 'Test Subtitle' });
    const title = screen.getByText('Test Title');
    const subtitle = screen.getByText('Test Subtitle');

    expect(title.style.fontSize).toBe('1.25rem');
    expect(title.style.fontWeight).toBe('700');
    expect(subtitle.style.fontSize).toBe('1rem');
    expect(subtitle.style.fontWeight).toBe('400');
  });

  it('renders with proper spacing between elements', () => {
    renderDialogContainer({ title: 'Test Title', subtitle: 'Test Subtitle' });
    const subtitle = screen.getByText('Test Subtitle');
    expect(subtitle.style.marginTop).toBe('8px');
  });

  it('renders with proper close button styles', () => {
    renderDialogContainer({ onClose: vi.fn(), title: 'Test Title' });
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton.style.color).toBe('rgb(158, 158, 158)');
    expect(closeButton.style.padding).toBe('8px');
  });

  it('handles close button click', () => {
    const onClose = vi.fn();
    renderDialogContainer({ onClose, title: 'Test Title' });
    const closeButton = screen.getByRole('button', { name: /close/i });

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
