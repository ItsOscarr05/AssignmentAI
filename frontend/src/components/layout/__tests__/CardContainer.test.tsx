import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { CardContainer } from '../CardContainer';

// Mock the Material-UI useTheme hook
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    useTheme: () => theme,
  };
});

const renderCardContainer = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <CardContainer {...props}>
        <div>Test Content</div>
      </CardContainer>
    </ThemeProvider>
  );
};

describe('CardContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    renderCardContainer();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    renderCardContainer({ title: 'Test Card' });
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders with custom subtitle', () => {
    renderCardContainer({ subtitle: 'Test Subtitle' });
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders with custom actions', () => {
    const actions = <button>Test Action</button>;
    renderCardContainer({ actions });
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('renders with custom elevation', () => {
    renderCardContainer({ elevation: 3 });
    const card = screen.getByTestId('card-container');
    expect(card).toHaveClass('MuiPaper-elevation3');
  });

  it('renders with proper container styles', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card).toHaveClass('MuiPaper-root');
    expect(card).toHaveClass('MuiPaper-elevation1');
    expect(card).toHaveClass('MuiPaper-rounded');
  });

  it('renders with proper header styles', () => {
    renderCardContainer({ title: 'Test Card' });
    const header = screen.getByTestId('card-header');

    // Check for Material-UI classes and attributes
    expect(header).toHaveClass('MuiBox-root');
    expect(header).toHaveStyle({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    });
  });

  it('renders with proper title styles', () => {
    renderCardContainer({ title: 'Test Card' });
    const title = screen.getByText('Test Card');

    // Check for Material-UI classes
    expect(title).toHaveClass('MuiTypography-root');
    expect(title).toHaveClass('MuiTypography-h6');
  });

  it('renders with proper subtitle styles', () => {
    renderCardContainer({ subtitle: 'Test Subtitle' });
    const subtitle = screen.getByText('Test Subtitle');

    // Check for Material-UI classes
    expect(subtitle).toHaveClass('MuiTypography-root');
    expect(subtitle).toHaveClass('MuiTypography-body2');
  });

  it('renders with proper content styles', () => {
    renderCardContainer();
    const content = screen.getByTestId('card-content');

    // Check for Material-UI classes
    expect(content).toHaveClass('MuiBox-root');
  });

  it('renders with proper responsive design', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card).toHaveClass('MuiPaper-root');
    expect(card).toHaveClass('MuiPaper-rounded');
  });

  it('renders with proper typography styles', () => {
    renderCardContainer({ title: 'Test Card', subtitle: 'Test Subtitle' });
    const title = screen.getByText('Test Card');
    const subtitle = screen.getByText('Test Subtitle');

    // Check for Material-UI classes
    expect(title).toHaveClass('MuiTypography-h6');
    expect(subtitle).toHaveClass('MuiTypography-body2');
  });

  it('renders with proper border radius', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card).toHaveClass('MuiPaper-rounded');
  });

  it('renders with proper spacing between elements', () => {
    renderCardContainer({ title: 'Test Card', subtitle: 'Test Subtitle' });
    const header = screen.getByTestId('card-header');
    const content = screen.getByTestId('card-content');

    // Check for Material-UI classes
    expect(header).toHaveClass('MuiBox-root');
    expect(content).toHaveClass('MuiBox-root');
  });

  it('renders with proper background colors', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card).toHaveClass('MuiPaper-root');
  });

  it('renders with proper hover styles', () => {
    renderCardContainer({ hover: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card).toHaveClass('MuiPaper-root');
    expect(card).toHaveStyle({
      transition:
        'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    });
  });

  it('renders with proper clickable styles', () => {
    renderCardContainer({ clickable: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes and attributes
    expect(card).toHaveClass('MuiPaper-root');
    expect(card).toHaveStyle({
      cursor: 'pointer',
      transition:
        'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    });
  });

  it('renders with proper disabled styles', () => {
    renderCardContainer({ disabled: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes and attributes
    expect(card).toHaveClass('MuiPaper-root');
    expect(card).toHaveStyle({
      opacity: '0.5',
      pointerEvents: 'none',
    });
  });

  it('renders with proper selected styles', () => {
    renderCardContainer({ selected: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes and attributes
    expect(card).toHaveClass('MuiPaper-root');
    expect(card).toHaveStyle({
      border: `2px solid ${theme.palette.primary.main}`,
    });
  });
});
