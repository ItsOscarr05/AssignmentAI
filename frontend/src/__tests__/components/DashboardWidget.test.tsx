import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardWidget from '../../components/dashboard/DashboardWidget';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, sx }: any) => (
    <div data-testid="box" style={sx}>
      {children}
    </div>
  ),
  Card: ({ children, sx }: any) => (
    <div data-testid="card" style={sx}>
      {children}
    </div>
  ),
  CardContent: ({ children, sx }: any) => (
    <div data-testid="card-content" style={sx}>
      {children}
    </div>
  ),
  CardHeader: ({ title, action }: any) => (
    <div data-testid="card-header">
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-actions">{action}</div>
    </div>
  ),
  IconButton: ({ onClick, children, size }: any) => (
    <button onClick={onClick} data-testid="icon-button" data-size={size}>
      {children}
    </button>
  ),
  Menu: ({ children, open }: any) => (open ? <div data-testid="menu">{children}</div> : null),
  MenuItem: ({ onClick, children }: any) => (
    <button onClick={onClick} data-testid="menu-item">
      {children}
    </button>
  ),
  Tooltip: ({ children, title }: any) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  Typography: ({ children, color }: any) => (
    <div data-testid="typography" style={{ color }}>
      {children}
    </div>
  ),
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  MoreVert: () => <span data-testid="more-vert-icon">MoreVert</span>,
  Refresh: () => <span data-testid="refresh-icon">Refresh</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
}));

describe('DashboardWidget', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders widget with basic configuration', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config} onRefresh={mockOnRefresh}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    expect(screen.getByText('Test Widget')).toBeTruthy();
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('handles refresh action', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config} onRefresh={mockOnRefresh}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    // Find the refresh button by its icon
    const refreshButton = screen.getByTestId('refresh-icon').closest('button');
    fireEvent.click(refreshButton!);
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('handles configure action', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config} onConfigure={mockOnEdit}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    fireEvent.click(screen.getByTestId('icon-button'));
    fireEvent.click(screen.getByText('Configure'));
    expect(mockOnEdit).toHaveBeenCalledWith('test-widget');
  });

  it('handles remove action', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config} onRemove={mockOnDelete}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    fireEvent.click(screen.getByTestId('icon-button'));
    fireEvent.click(screen.getByText('Remove Widget'));
    expect(mockOnDelete).toHaveBeenCalledWith('test-widget');
  });

  it('applies correct size styles', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'medium' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    const card = screen.getByTestId('card');
    expect(card.style.width).toBe('450px');
    expect(card.style.height).toBe('300px');
  });

  it('renders with large size', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'large' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    const card = screen.getByTestId('card');
    expect(card.style.width).toBe('600px');
    expect(card.style.height).toBe('400px');
  });

  it('renders with small size', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    const card = screen.getByTestId('card');
    expect(card.style.width).toBe('300px');
    expect(card.style.height).toBe('200px');
  });

  it('handles menu open and close', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config} onConfigure={mockOnEdit}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    // Open menu
    fireEvent.click(screen.getByTestId('icon-button'));
    expect(screen.getByTestId('menu')).toBeTruthy();

    // Close menu
    fireEvent.click(screen.getByText('Configure'));
    expect(screen.queryByTestId('menu')).not.toBeTruthy();
  });

  it('renders without optional actions', () => {
    const config = {
      id: 'test-widget',
      type: 'metric' as const,
      title: 'Test Widget',
      size: 'small' as const,
      position: 0,
      data: { test: 'data' },
    };

    render(
      <DashboardWidget config={config}>
        <div>Test Content</div>
      </DashboardWidget>
    );

    expect(screen.queryByTestId('tooltip')).not.toBeTruthy();
    expect(screen.queryByText('Configure')).not.toBeTruthy();
    expect(screen.queryByText('Remove Widget')).not.toBeTruthy();
  });
});
