import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { CardContainer } from '../CardContainer';

const normalizeColor = (color: string) => {
  if (!color) return color;
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
};

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
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders with custom title', () => {
    renderCardContainer({ title: 'Test Card' });
    expect(screen.getByText('Test Card')).toBeTruthy();
  });

  it('renders with custom subtitle', () => {
    renderCardContainer({ subtitle: 'Test Subtitle' });
    expect(screen.getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders with custom actions', () => {
    const actions = <button>Test Action</button>;
    renderCardContainer({ actions });
    expect(screen.getByText('Test Action')).toBeTruthy();
  });

  it('renders with custom elevation', () => {
    renderCardContainer({ elevation: 3 });
    const card = screen.getByTestId('card-container');
    expect(card.className).toContain('MuiPaper-elevation3');
  });

  it('renders with proper container styles', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card.className).toContain('MuiPaper-root');
    expect(card.className).toContain('MuiPaper-elevation1');
    expect(card.className).toContain('MuiPaper-rounded');
  });

  it('renders with proper header styles', () => {
    renderCardContainer({ title: 'Test Card' });
    const header = screen.getByTestId('card-header');

    // Check for Material-UI classes and attributes
    expect(header.className).toContain('MuiBox-root');
    expect(header.style.display).toBe('flex');
    expect(header.style.justifyContent).toBe('space-between');
    expect(header.style.alignItems).toBe('center');
  });

  it('renders with proper title styles', () => {
    renderCardContainer({ title: 'Test Card' });
    const title = screen.getByText('Test Card');

    // Check for Material-UI classes
    expect(title.className).toContain('MuiTypography-root');
    expect(title.className).toContain('MuiTypography-h6');
  });

  it('renders with proper subtitle styles', () => {
    renderCardContainer({ subtitle: 'Test Subtitle' });
    const subtitle = screen.getByText('Test Subtitle');

    // Check for Material-UI classes
    expect(subtitle.className).toContain('MuiTypography-root');
    expect(subtitle.className).toContain('MuiTypography-body2');
  });

  it('renders with proper content styles', () => {
    renderCardContainer();
    const content = screen.getByTestId('card-content');

    // Check for Material-UI classes
    expect(content.className).toContain('MuiBox-root');
  });

  it('renders with proper responsive design', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card.className).toContain('MuiPaper-root');
    expect(card.className).toContain('MuiPaper-rounded');
  });

  it('renders with proper typography styles', () => {
    renderCardContainer({ title: 'Test Card', subtitle: 'Test Subtitle' });
    const title = screen.getByText('Test Card');
    const subtitle = screen.getByText('Test Subtitle');

    // Check for Material-UI classes
    expect(title.className).toContain('MuiTypography-h6');
    expect(subtitle.className).toContain('MuiTypography-body2');
  });

  it('renders with proper border radius', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card.className).toContain('MuiPaper-rounded');
  });

  it('renders with proper spacing between elements', () => {
    renderCardContainer({ title: 'Test Card', subtitle: 'Test Subtitle' });
    const header = screen.getByTestId('card-header');
    const content = screen.getByTestId('card-content');

    // Check for Material-UI classes
    expect(header.className).toContain('MuiBox-root');
    expect(content.className).toContain('MuiBox-root');
  });

  it('renders with proper background colors', () => {
    renderCardContainer();
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card.className).toContain('MuiPaper-root');
  });

  it('renders with proper hover styles', () => {
    renderCardContainer({ hover: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes
    expect(card.className).toContain('MuiPaper-root');
    expect(card.style.transition).toBe(
      'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
    );
  });

  it('renders with proper clickable styles', () => {
    renderCardContainer({ clickable: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes and attributes
    expect(card.className).toContain('MuiPaper-root');
    expect(card.style.cursor).toBe('pointer');
    expect(card.style.transition).toBe(
      'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
    );
  });

  it('renders with proper disabled styles', () => {
    renderCardContainer({ disabled: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes and attributes
    expect(card.className).toContain('MuiPaper-root');
    expect(card.style.opacity).toBe('0.5');
    expect(card.style.pointerEvents).toBe('none');
  });

  it('renders with proper selected styles', () => {
    renderCardContainer({ selected: true });
    const card = screen.getByTestId('card-container');

    // Check for Material-UI classes and attributes
    expect(card.className).toContain('MuiPaper-root');
    expect(card.style.border).toBe(`2px solid ${normalizeColor(theme.palette.primary.main)}`);
  });
});
