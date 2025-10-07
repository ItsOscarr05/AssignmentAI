import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { PageContainer } from '../PageContainer';

// Mock Material-UI components and hooks
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      spacing: (value: number) => `${value * 8}px`,
      breakpoints: {
        values: {
          lg: 1200,
        },
        down: () => false,
      },
      palette: {
        background: {
          default: '#ffffff',
          paper: '#ffffff',
        },
        text: {
          primary: 'rgb(26, 26, 26)',
          secondary: 'rgb(102, 102, 102)',
        },
      },
      typography: {
        h4: {
          fontSize: '2rem',
        },
        subtitle1: {
          fontSize: '1rem',
        },
        fontWeightBold: 700,
        fontWeightRegular: 400,
      },
      shape: {
        borderRadius: 4,
      },
      shadows: ['none', '0px 2px 4px rgba(0, 0, 0, 0.1)'],
    }),
    Box: ({ children, sx, ...props }: any) => (
      <div
        {...props}
        style={{
          ...(sx?.padding && { padding: sx.padding }),
          ...(sx?.margin && { margin: sx.margin }),
          ...(sx?.marginBottom && { marginBottom: sx.marginBottom }),
          ...(sx?.marginTop && { marginTop: sx.marginTop }),
          ...(sx?.display && { display: sx.display }),
          ...(sx?.justifyContent && { justifyContent: sx.justifyContent }),
          ...(sx?.alignItems && { alignItems: sx.alignItems }),
          ...(sx?.flexWrap && { flexWrap: sx.flexWrap }),
          ...(sx?.gap && { gap: sx.gap }),
          ...(sx?.backgroundColor && { backgroundColor: sx.backgroundColor }),
          ...(sx?.color && { color: sx.color }),
          ...(sx?.fontSize && { fontSize: sx.fontSize }),
          ...(sx?.fontWeight && { fontWeight: sx.fontWeight }),
          ...(sx?.borderRadius && { borderRadius: `${sx.borderRadius}px` }),
          ...(sx?.boxShadow && { boxShadow: sx.boxShadow }),
        }}
      >
        {children}
      </div>
    ),
    Container: ({ children, sx, ...props }: any) => (
      <div
        {...props}
        style={{
          ...(sx?.padding && { padding: sx.padding }),
          ...(sx?.margin && { margin: sx.margin }),
          ...(sx?.backgroundColor && { backgroundColor: sx.backgroundColor }),
        }}
      >
        {children}
      </div>
    ),
    Paper: ({ children, sx, elevation, ...props }: any) => (
      <div
        {...props}
        style={{
          ...(sx?.padding && { padding: sx.padding }),
          ...(sx?.backgroundColor && { backgroundColor: sx.backgroundColor }),
          ...(sx?.borderRadius && { borderRadius: `${sx.borderRadius}px` }),
          ...(sx?.boxShadow && { boxShadow: sx.boxShadow }),
          ...(elevation && { boxShadow: theme.shadows[elevation] }),
        }}
      >
        {children}
      </div>
    ),
    Typography: ({ children, sx, variant, color, ...props }: any) => {
      // Use the actual theme from the test file
      const styles = {
        ...(sx?.margin === 0 && { margin: '0px' }),
        ...(sx?.marginTop && { marginTop: theme.spacing(sx.marginTop) }),
        ...(sx?.fontSize && { fontSize: sx.fontSize }),
        ...(sx?.fontWeight && { fontWeight: sx.fontWeight }),
        ...(variant === 'h4' && { fontSize: theme.typography.h4.fontSize }),
        ...(variant === 'subtitle1' && { fontSize: theme.typography.subtitle1.fontSize }),
      };

      // Handle color using the actual theme
      if (color === 'text.secondary') {
        styles.color = theme.palette.text.secondary;
      } else if (sx?.color) {
        styles.color = sx.color;
      }

      console.log('Typography styles:', styles);

      return (
        <div {...props} style={styles}>
          {children}
        </div>
      );
    },
  };
});

const renderPageContainer = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <PageContainer {...props}>
        <div data-testid="test-content">Test Content</div>
      </PageContainer>
    </ThemeProvider>
  );
};

describe('PageContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    renderPageContainer();
    expect(screen.getByTestId('test-content')).toBeTruthy();
  });

  it('renders with custom title', () => {
    renderPageContainer({ title: 'Test Page' });
    expect(screen.getByTestId('page-title').textContent).toBe('Test Page');
  });

  it('renders with custom subtitle', () => {
    renderPageContainer({ subtitle: 'Test Subtitle' });
    expect(screen.getByTestId('page-subtitle').textContent).toBe('Test Subtitle');
  });

  it('renders with custom actions', () => {
    const actions = <button data-testid="test-action">Test Action</button>;
    renderPageContainer({ actions });
    expect(screen.getByTestId('test-action')).toBeTruthy();
  });

  it('renders with proper container styles', () => {
    renderPageContainer();
    const container = screen.getByTestId('page-container');

    // Check container styles
    expect(container.style.padding).toBe('24px');
    expect(container.style.margin).toBe('0 auto');
  });

  it('renders with proper header styles', () => {
    renderPageContainer({ title: 'Test Page' });
    const header = screen.getByTestId('page-header');

    // Check header styles
    expect(header.style.marginBottom).toBe(theme.spacing(3));
    expect(header.style.display).toBe('flex');
    expect(header.style.justifyContent).toBe('space-between');
    expect(header.style.alignItems).toBe('center');
  });

  it('renders with proper title styles', () => {
    renderPageContainer({ title: 'Test Page' });
    const title = screen.getByTestId('page-title');

    // Check title styles
    expect(title.style.margin).toBe('0px');
    expect(title.style.color).toBe('rgb(26, 26, 26)');
  });

  it('renders with proper subtitle styles', () => {
    renderPageContainer({ subtitle: 'Test Subtitle' });
    const subtitle = screen.getByTestId('page-subtitle');

    // Debug logging
    console.log('Subtitle element:', subtitle);
    console.log('Subtitle styles:', subtitle.style);
    console.log('Subtitle computed styles:', window.getComputedStyle(subtitle));

    // Check subtitle styles
    expect(subtitle.style.marginTop).toBe('8px');
    expect(subtitle.style.color).toBe('rgb(102, 102, 102)');
  });

  it('renders with proper content styles', () => {
    renderPageContainer();
    const content = screen.getByTestId('page-content');

    // Check content styles
    expect(content.style.padding).toBe('24px');
  });

  it('renders with proper responsive design', () => {
    renderPageContainer();
    const container = screen.getByTestId('page-container');

    // Check responsive styles - we can only check the default styles
    // Media queries can't be tested directly with toHaveStyle
    expect(container.style.padding).toBe('24px');
  });

  it('renders with proper typography styles', () => {
    renderPageContainer({ title: 'Test Page', subtitle: 'Test Subtitle' });
    const title = screen.getByTestId('page-title');
    const subtitle = screen.getByTestId('page-subtitle');

    // Check typography styles
    expect(title.style.fontSize).toBe(theme.typography.h4.fontSize);
    expect(title.style.fontWeight).toBe(theme.typography.fontWeightBold);
    expect(subtitle.style.fontSize).toBe(theme.typography.subtitle1.fontSize);
    expect(subtitle.style.fontWeight).toBe(theme.typography.fontWeightRegular);
  });

  it('renders with proper elevation', () => {
    renderPageContainer();
    const content = screen.getByTestId('page-content');

    // Check elevation
    expect(content.style.boxShadow).toBe(theme.shadows[1]);
  });

  it('renders with proper border radius', () => {
    renderPageContainer();
    const content = screen.getByTestId('page-content');

    // Check border radius
    expect(content.style.borderRadius).toBe('4px');
  });

  it('renders with proper spacing between elements', () => {
    renderPageContainer({ title: 'Test Page', subtitle: 'Test Subtitle' });
    const header = screen.getByTestId('page-header');
    const content = screen.getByTestId('page-content');

    // Check spacing between elements
    expect(header.style.marginBottom).toBe(theme.spacing(3));
    expect(content.style.padding).toBe(theme.spacing(3));
  });

  it('renders with proper background colors', () => {
    renderPageContainer();
    const container = screen.getByTestId('page-container');
    const content = screen.getByTestId('page-content');

    // Check background colors
    expect(container.style.backgroundColor).toBe(theme.palette.background.default);
    expect(content.style.backgroundColor).toBe(theme.palette.background.paper);
  });
});
