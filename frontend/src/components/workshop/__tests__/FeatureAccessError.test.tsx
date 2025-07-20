import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureAccessError } from '../../../services/WorkshopService';
import { FeatureAccessErrorComponent } from '../FeatureAccessError';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Upgrade: () => <div data-testid="upgrade-icon">Upgrade</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
}));

const theme = createTheme();

const mockError: FeatureAccessError = {
  error: 'Feature not available in your plan',
  feature: 'diagram_generation',
  current_plan: 'free',
  upgrade_message: 'Upgrade to Pro plan to access diagram generation',
  upgrade_url: '/dashboard/price-plan',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('FeatureAccessErrorComponent', () => {
  const mockOnUpgrade = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the error component with correct content', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    // Check for main error title
    expect(screen.getByText('Feature Not Available')).toBeInTheDocument();

    // Check for upgrade alert
    expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => {
          return !!(
            element?.textContent?.includes('Diagram Generation') &&
            element?.textContent?.includes('is not available')
          );
        },
        { selector: 'p[variant="body2"]' }
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Upgrade to Pro plan to access diagram generation')
    ).toBeInTheDocument();

    // Check for plan chips
    expect(
      screen.getByText(
        (_, element) => {
          return !!element?.getAttribute('label')?.includes('Current Plan: Free');
        },
        { selector: '[data-testid="chip"]' }
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => {
          return !!element?.getAttribute('label')?.includes('Required: Diagram Generation');
        },
        { selector: '[data-testid="chip"]' }
      )
    ).toBeInTheDocument();
  });

  it('displays correct feature name for different features', () => {
    const imageAnalysisError: FeatureAccessError = {
      ...mockError,
      feature: 'image_analysis',
    };

    renderWithTheme(
      <FeatureAccessErrorComponent
        error={imageAnalysisError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      screen.getByText(
        (_, element) => {
          return !!(
            element?.textContent?.includes('Image Analysis') &&
            element?.textContent?.includes('is not available')
          );
        },
        { selector: 'p[variant="body2"]' }
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => {
          return !!element?.getAttribute('label')?.includes('Required: Image Analysis');
        },
        { selector: '[data-testid="chip"]' }
      )
    ).toBeInTheDocument();
  });

  it('displays correct plan names', () => {
    const plusPlanError: FeatureAccessError = {
      ...mockError,
      current_plan: 'plus',
    };

    renderWithTheme(
      <FeatureAccessErrorComponent
        error={plusPlanError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      screen.getByText(
        (_, element) => {
          return !!element?.getAttribute('label')?.includes('Current Plan: Plus');
        },
        { selector: '[data-testid="chip"]' }
      )
    ).toBeInTheDocument();
  });

  it('shows correct upgrade button text for different plans', () => {
    // Test Free plan
    const { rerender } = renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );
    expect(screen.getByText('Upgrade to Plus')).toBeInTheDocument();

    // Test Plus plan
    const plusError: FeatureAccessError = { ...mockError, current_plan: 'plus' };
    rerender(
      <ThemeProvider theme={theme}>
        <FeatureAccessErrorComponent
          error={plusError}
          onUpgrade={mockOnUpgrade}
          onDismiss={mockOnDismiss}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();

    // Test Pro plan
    const proError: FeatureAccessError = { ...mockError, current_plan: 'pro' };
    rerender(
      <ThemeProvider theme={theme}>
        <FeatureAccessErrorComponent
          error={proError}
          onUpgrade={mockOnUpgrade}
          onDismiss={mockOnDismiss}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('Upgrade to Max')).toBeInTheDocument();

    // Test Max plan
    const maxError: FeatureAccessError = { ...mockError, current_plan: 'max' };
    rerender(
      <ThemeProvider theme={theme}>
        <FeatureAccessErrorComponent
          error={maxError}
          onUpgrade={mockOnUpgrade}
          onDismiss={mockOnDismiss}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('calls onUpgrade when upgrade button is clicked', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    const upgradeButton = screen.getByText('Upgrade to Plus');
    fireEvent.click(upgradeButton);

    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('opens pricing page when View Plans button is clicked', () => {
    const mockOpen = vi.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    const viewPlansButton = screen.getByText('View Plans');
    fireEvent.click(viewPlansButton);

    expect(mockOpen).toHaveBeenCalledWith('/dashboard/price-plan', '_blank');
  });

  it('displays tip message', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      screen.getByText(
        (_, element) => {
          return !!(
            element?.textContent?.includes('Tip:') &&
            element?.textContent?.includes('Upgrade your plan to unlock premium features')
          );
        },
        { selector: 'p' }
      )
    ).toBeInTheDocument();
  });

  it('handles unknown features gracefully', () => {
    const unknownFeatureError: FeatureAccessError = {
      ...mockError,
      feature: 'unknown_feature',
    };

    renderWithTheme(
      <FeatureAccessErrorComponent
        error={unknownFeatureError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      screen.getByText(
        (_, element) => {
          return !!(
            element?.textContent?.includes('Unknown Feature') &&
            element?.textContent?.includes('is not available')
          );
        },
        { selector: 'p' }
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => {
          return !!element?.getAttribute('label')?.includes('Required: Unknown Feature');
        },
        { selector: '[data-testid="chip"]' }
      )
    ).toBeInTheDocument();
  });

  it('handles unknown plans gracefully', () => {
    const unknownPlanError: FeatureAccessError = {
      ...mockError,
      current_plan: 'unknown_plan',
    };

    renderWithTheme(
      <FeatureAccessErrorComponent
        error={unknownPlanError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      screen.getByText(
        (_, element) => {
          return !!element?.getAttribute('label')?.includes('Current Plan: unknown_plan');
        },
        { selector: '[data-testid="chip"]' }
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });

  it('displays all required buttons', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Upgrade to Plus')).toBeInTheDocument();
    expect(screen.getByText('View Plans')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    // Check that buttons are accessible
    const upgradeButton = screen.getByRole('button', { name: /upgrade to plus/i });
    const viewPlansButton = screen.getByRole('button', { name: /view plans/i });
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });

    expect(upgradeButton).toBeInTheDocument();
    expect(viewPlansButton).toBeInTheDocument();
    expect(dismissButton).toBeInTheDocument();
  });

  it('displays warning alert with correct severity', () => {
    renderWithTheme(
      <FeatureAccessErrorComponent
        error={mockError}
        onUpgrade={mockOnUpgrade}
        onDismiss={mockOnDismiss}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-severity', 'warning');
  });
});
