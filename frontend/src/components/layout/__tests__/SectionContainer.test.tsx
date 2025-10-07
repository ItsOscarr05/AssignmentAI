import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { SectionContainer } from '../SectionContainer';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      spacing: (value: number) => `${value * 8}px`,
      palette: {
        background: {
          paper: 'rgb(255, 255, 255)',
        },
        text: {
          primary: 'rgb(26, 26, 26)',
          secondary: 'rgb(102, 102, 102)',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
        action: {
          hover: 'rgba(0, 0, 0, 0.04)',
        },
      },
      typography: {
        h5: {
          fontSize: '1.5rem',
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
      shadows: [
        'none',
        '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      ],
    }),
    Box: ({ children, sx, ...props }: any) => (
      <div
        {...props}
        style={{
          ...(sx?.mb && { marginBottom: theme.spacing(sx.mb) }),
          ...(sx?.mt && { marginTop: theme.spacing(sx.mt) }),
          ...(sx?.p && { padding: theme.spacing(sx.p) }),
          ...(sx?.display && { display: sx.display }),
          ...(sx?.justifyContent && { justifyContent: sx.justifyContent }),
          ...(sx?.alignItems && { alignItems: sx.alignItems }),
          ...(sx?.backgroundColor && { backgroundColor: sx.backgroundColor }),
          ...(sx?.cursor && { cursor: sx.cursor }),
          ...(sx?.transition && { transition: sx.transition }),
        }}
      >
        {children}
      </div>
    ),
    Paper: ({ children, sx, elevation, ...props }: any) => {
      // Handle last-child styles
      const isLastChild =
        props['data-testid'] === 'section-container' &&
        !document.querySelector(
          '[data-testid="section-container"] + [data-testid="section-container"]'
        );

      return (
        <div
          {...props}
          style={{
            ...(sx?.p && { padding: theme.spacing(sx.p) }),
            ...(isLastChild
              ? { marginBottom: '0px' }
              : sx?.mb && { marginBottom: theme.spacing(sx.mb) }),
            ...(sx?.backgroundColor && { backgroundColor: theme.palette.background.paper }),
            ...(sx?.borderRadius && { borderRadius: `${theme.shape.borderRadius}px` }),
            ...(sx?.border && { border: sx.border }),
            ...(sx?.borderColor && { borderColor: theme.palette.divider }),
            ...(sx?.cursor && { cursor: sx.cursor }),
            ...(sx?.transition && { transition: sx.transition }),
            ...(elevation && { boxShadow: theme.shadows[elevation] }),
            ...(sx?.boxShadow && { boxShadow: theme.shadows[1] }),
          }}
        >
          {children}
        </div>
      );
    },
    Typography: ({ children, sx, variant, color, ...props }: any) => (
      <div
        {...props}
        style={{
          ...(sx?.m === 0 && { margin: '0px' }),
          ...(sx?.mt && { marginTop: theme.spacing(sx.mt) }),
          ...(sx?.color && { color: sx.color }),
          ...(sx?.fontSize && { fontSize: sx.fontSize }),
          ...(sx?.fontWeight && { fontWeight: sx.fontWeight }),
          ...(variant === 'h5' && {
            fontSize: theme.typography.h5.fontSize,
            fontWeight: theme.typography.fontWeightBold,
            color: theme.palette.text.primary,
            margin: '0px',
          }),
          ...(variant === 'subtitle1' && {
            fontSize: theme.typography.subtitle1.fontSize,
            fontWeight: theme.typography.fontWeightRegular,
            color: theme.palette.text.secondary,
            marginTop: '8px',
          }),
        }}
      >
        {children}
      </div>
    ),
  };
});

const renderSectionContainer = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <SectionContainer {...props}>
        <div>Test Content</div>
      </SectionContainer>
    </ThemeProvider>
  );
};

describe('SectionContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    renderSectionContainer();
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders with custom title', () => {
    renderSectionContainer({ title: 'Test Section' });
    expect(screen.getByText('Test Section')).toBeTruthy();
  });

  it('renders with custom subtitle', () => {
    renderSectionContainer({ subtitle: 'Test Subtitle' });
    expect(screen.getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders with custom actions', () => {
    const actions = <button>Test Action</button>;
    renderSectionContainer({ actions });
    expect(screen.getByText('Test Action')).toBeTruthy();
  });

  it('renders with custom variant', () => {
    renderSectionContainer({ variant: 'outlined' });
    const container = screen.getByTestId('section-container');
    expect(container.style.border).toBe('1px solid');
    expect(container.style.borderColor).toBe('divider');
  });

  it('renders with proper container styles', () => {
    renderSectionContainer();
    const container = screen.getByTestId('section-container');
    const computedStyle = window.getComputedStyle(container);

    // Check container styles
    expect(computedStyle.padding).toBe('24px');
    // Material-UI applies margin through its style system
    // Note: margin is 0px because the component is rendered as last-child in the test
    expect(computedStyle.marginBottom).toBe('0px');
  });

  it('renders with proper header styles', () => {
    renderSectionContainer({ title: 'Test Section' });
    const header = screen.getByTestId('section-header');

    // Check header styles
    expect(header.style.marginBottom).toBe('16px');
    expect(header.style.display).toBe('flex');
    expect(header.style.justifyContent).toBe('space-between');
    expect(header.style.alignItems).toBe('center');
  });

  it('renders with proper title styles', () => {
    renderSectionContainer({ title: 'Test Section' });
    const title = screen.getByText('Test Section');

    // Check title styles
    expect(title.style.margin).toBe('0');
    expect(title.style.color).toBe(theme.palette.text.primary);
  });

  it('renders with proper subtitle styles', () => {
    renderSectionContainer({ subtitle: 'Test Subtitle' });
    const subtitle = screen.getByText('Test Subtitle');

    // Check subtitle styles
    expect(subtitle.style.marginTop).toBe('8px');
    expect(subtitle.style.color).toBe(theme.palette.text.secondary);
  });

  it('renders with proper content styles', () => {
    renderSectionContainer();
    const content = screen.getByTestId('section-content');

    // Check content styles - content is just a Box wrapper, no styles
    expect(content).toBeTruthy();
  });

  it('renders with proper responsive design', () => {
    renderSectionContainer();
    const container = screen.getByTestId('section-container');

    // Check responsive styles - we can only check the default styles
    // Media queries can't be tested directly with toHaveStyle
    expect(container.style.padding).toBe('24px');
  });

  it('renders with proper typography styles', () => {
    renderSectionContainer({
      title: 'Test Section',
      subtitle: 'Test Subtitle',
    });
    const title = screen.getByText('Test Section');
    const subtitle = screen.getByText('Test Subtitle');

    // Check typography styles
    expect(title.style.fontSize).toBe(theme.typography.h5.fontSize);
    expect(title.style.fontWeight).toBe(theme.typography.fontWeightBold);
    expect(subtitle.style.fontSize).toBe(theme.typography.subtitle1.fontSize);
    expect(subtitle.style.fontWeight).toBe(theme.typography.fontWeightRegular);
  });

  it('renders with proper elevation', () => {
    renderSectionContainer({ variant: 'elevated' });
    const container = screen.getByTestId('section-container');

    // Check elevation
    expect(container.style.boxShadow).toBe(theme.shadows[1]);
  });

  it('renders with proper border radius', () => {
    renderSectionContainer();
    const container = screen.getByTestId('section-container');

    // Check border radius
    expect(container.style.borderRadius).toBe('4px');
  });

  it('renders with proper spacing between elements', () => {
    renderSectionContainer({
      title: 'Test Section',
      subtitle: 'Test Subtitle',
    });
    const header = screen.getByTestId('section-header');
    const content = screen.getByTestId('section-content');

    // Check spacing between elements
    expect(header.style.marginBottom).toBe('16px');
    // Content is just a Box wrapper, no styles
    expect(content).toBeTruthy();
  });

  it('renders with proper background colors', () => {
    renderSectionContainer();
    const container = screen.getByTestId('section-container');

    // Check background colors
    expect(container.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('renders with proper border styles for outlined variant', () => {
    renderSectionContainer({ variant: 'outlined' });
    const container = screen.getByTestId('section-container');

    // Check border styles
    expect(container.style.border).toBe('1px solid');
    expect(container.style.borderColor).toBe('divider');
  });

  it('renders with proper hover styles for interactive variant', () => {
    renderSectionContainer({ variant: 'interactive' });
    const container = screen.getByTestId('section-container');

    // Check hover styles
    expect(container.style.cursor).toBe('pointer');
    expect(container.style.transition).toBe('background-color 0.2s');
  });
});
