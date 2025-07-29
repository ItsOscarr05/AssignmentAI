import { ThemeProvider, createTheme } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import TimezoneSelector from './TimezoneSelector';

// Mock the timezone hook
vi.mock('../../hooks/useTimezone', () => ({
  useTimezone: () => ({
    detectedTimezone: 'America/New_York',
    isDetecting: false,
    refreshDetection: vi.fn(),
  }),
}));

// Mock the translation hook
vi.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
    </ThemeProvider>
  );
};

describe('TimezoneSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithProviders(<TimezoneSelector value="UTC" onChange={mockOnChange} label="Timezone" />);

    expect(screen.getByText('Timezone')).toBeInTheDocument();
  });

  it('shows timezone options grouped by region', () => {
    renderWithProviders(<TimezoneSelector value="UTC" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    // Check that regional headers are present
    waitFor(() => {
      expect(screen.getByText('North America')).toBeInTheDocument();
      expect(screen.getByText('Europe')).toBeInTheDocument();
      expect(screen.getByText('Asia')).toBeInTheDocument();
    });
  });

  it('calls onChange when timezone is selected', () => {
    renderWithProviders(<TimezoneSelector value="UTC" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    // Wait for menu to open and select a timezone
    waitFor(() => {
      const option = screen.getByText('Eastern Standard Time (EST)');
      fireEvent.click(option);
      expect(mockOnChange).toHaveBeenCalledWith('America/New_York');
    });
  });

  it('displays timezone options with standard names', () => {
    renderWithProviders(<TimezoneSelector value="UTC" onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    // Check that timezone options show standard names
    waitFor(() => {
      expect(screen.getByText('Eastern Standard Time (EST)')).toBeInTheDocument();
      expect(screen.getByText('Central Standard Time (CST)')).toBeInTheDocument();
      expect(screen.getByText('Pacific Standard Time (PST)')).toBeInTheDocument();
    });
  });
});
