import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme';
import EmptyState from '../common/EmptyState';

describe('EmptyState', () => {
  const renderEmptyState = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <EmptyState
          title="No items found"
          message="There are no items to display"
          icon="inbox"
          {...props}
        />
      </ThemeProvider>
    );
  };

  it('renders empty state with default props', () => {
    renderEmptyState();

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
    expect(screen.getByTestId('InboxIcon')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    renderEmptyState({ title: 'No results' });

    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    renderEmptyState({ message: 'Try adjusting your search' });

    expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    renderEmptyState({ icon: 'search' });

    expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
  });

  it('renders with custom action', () => {
    const onAction = vi.fn();
    renderEmptyState({ onAction });

    const actionButton = screen.getByText(/action/i);
    fireEvent.click(actionButton);
    expect(onAction).toHaveBeenCalled();
  });

  it('renders with custom action text', () => {
    renderEmptyState({ actionText: 'Create New' });

    expect(screen.getByText('Create New')).toBeInTheDocument();
  });

  it('renders with custom action icon', () => {
    renderEmptyState({ actionIcon: 'add' });

    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });

  it('renders with custom action color', () => {
    renderEmptyState({ actionColor: 'primary' });

    expect(screen.getByText(/action/i)).toHaveClass('MuiButton-colorPrimary');
  });

  it('renders with custom action variant', () => {
    renderEmptyState({ actionVariant: 'outlined' });

    expect(screen.getByText(/action/i)).toHaveClass('MuiButton-outlined');
  });

  it('renders with custom action size', () => {
    renderEmptyState({ actionSize: 'large' });

    expect(screen.getByText(/action/i)).toHaveClass('MuiButton-sizeLarge');
  });

  it('renders with custom action className', () => {
    renderEmptyState({ actionClassName: 'custom-action' });

    expect(screen.getByText(/action/i)).toHaveClass('custom-action');
  });

  it('renders with custom action style', () => {
    renderEmptyState({ actionStyle: { margin: '20px' } });

    expect(screen.getByText(/action/i)).toHaveStyle({ margin: '20px' });
  });

  it('renders with custom container className', () => {
    renderEmptyState({ containerClassName: 'custom-container' });

    expect(screen.getByRole('region')).toHaveClass('custom-container');
  });

  it('renders with custom container style', () => {
    renderEmptyState({ containerStyle: { padding: '20px' } });

    expect(screen.getByRole('region')).toHaveStyle({ padding: '20px' });
  });

  it('renders with custom icon className', () => {
    renderEmptyState({ iconClassName: 'custom-icon' });

    expect(screen.getByTestId('InboxIcon')).toHaveClass('custom-icon');
  });

  it('renders with custom icon style', () => {
    renderEmptyState({ iconStyle: { color: 'red' } });

    expect(screen.getByTestId('InboxIcon')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom title className', () => {
    renderEmptyState({ titleClassName: 'custom-title' });

    expect(screen.getByText('No items found')).toHaveClass('custom-title');
  });

  it('renders with custom title style', () => {
    renderEmptyState({ titleStyle: { color: 'red' } });

    expect(screen.getByText('No items found')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('renders with custom message className', () => {
    renderEmptyState({ messageClassName: 'custom-message' });

    expect(screen.getByText('There are no items to display')).toHaveClass('custom-message');
  });

  it('renders with custom message style', () => {
    renderEmptyState({ messageStyle: { color: 'red' } });

    expect(screen.getByText('There are no items to display')).toHaveStyle({
      color: 'rgb(255, 0, 0)',
    });
  });

  it('renders with custom aria-label', () => {
    renderEmptyState({ 'aria-label': 'Custom empty state' });

    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Custom empty state');
  });

  it('renders with custom aria-describedby', () => {
    renderEmptyState({ 'aria-describedby': 'custom-message' });

    expect(screen.getByRole('region')).toHaveAttribute('aria-describedby', 'custom-message');
  });

  it('renders with custom role', () => {
    renderEmptyState({ role: 'status' });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom tabIndex', () => {
    renderEmptyState({ tabIndex: 0 });

    expect(screen.getByRole('region')).toHaveAttribute('tabIndex', '0');
  });

  it('renders with custom data-testid', () => {
    renderEmptyState({ 'data-testid': 'custom-empty-state' });

    expect(screen.getByTestId('custom-empty-state')).toBeInTheDocument();
  });

  it('handles action button click', () => {
    const onAction = vi.fn();
    renderEmptyState({ onAction });

    const actionButton = screen.getByText(/action/i);
    fireEvent.click(actionButton);
    expect(onAction).toHaveBeenCalled();
  });

  it('handles action button disabled state', () => {
    renderEmptyState({ actionDisabled: true });

    expect(screen.getByText(/action/i)).toBeDisabled();
  });

  it('handles action button loading state', () => {
    renderEmptyState({ actionLoading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles empty state with no title', () => {
    renderEmptyState({ title: undefined });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('handles empty state with no message', () => {
    renderEmptyState({ message: undefined });

    expect(screen.queryByText(/message/i)).not.toBeInTheDocument();
  });

  it('handles empty state with no icon', () => {
    renderEmptyState({ icon: undefined });

    expect(screen.queryByTestId(/Icon/)).not.toBeInTheDocument();
  });

  it('handles empty state with no action', () => {
    renderEmptyState({ onAction: null });

    expect(screen.queryByText(/action/i)).not.toBeInTheDocument();
  });

  it('handles empty state with custom children', () => {
    renderEmptyState({ children: <div>Custom content</div> });

    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('handles empty state with custom image', () => {
    renderEmptyState({ image: 'https://example.com/image.jpg' });

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'No items found');
  });

  it('handles empty state with custom image alt text', () => {
    renderEmptyState({
      image: 'https://example.com/image.jpg',
      imageAlt: 'Custom alt text',
    });

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Custom alt text');
  });
});
