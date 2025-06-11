import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import LanguageSelector from '../LanguageSelector';

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Dialog: ({ children, ...props }: any) => (
      <div role="dialog" {...props}>
        {children}
      </div>
    ),
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
    ListItemText: ({ primary, ...props }: any) => <div {...props}>{primary}</div>,
    Divider: (props: any) => <hr {...props} />,
    Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CircularProgress: (props: any) => <div role="progressbar" {...props} />,
    CssBaseline: () => null,
    // Add menu-related components
    Menu: ({ children, ...props }: any) => (
      <div role="menu" {...props}>
        {children}
      </div>
    ),
    MenuList: ({ children, ...props }: any) => (
      <div role="menu" {...props}>
        {children}
      </div>
    ),
    MenuItem: ({ children, ...props }: any) => (
      <div role="menuitem" {...props}>
        {children}
      </div>
    ),
    TextField: ({ children, ...props }: any) => (
      <input type="text" {...props}>
        {children}
      </input>
    ),
  };
});

const renderLanguageSelector = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSelector />
    </I18nextProvider>
  );
};

describe('LanguageSelector', () => {
  it('renders language selector button', () => {
    renderLanguageSelector();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens language menu when clicked', () => {
    renderLanguageSelector();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const menus = screen.getAllByRole('menu');
    expect(menus.length).toBeGreaterThan(0);
  });

  it('changes language when a language option is selected', async () => {
    renderLanguageSelector();
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const languageOptions = screen.getAllByRole('menuitem', { name: 'English' });
    fireEvent.click(languageOptions[0]);

    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });
  });

  it('filters languages based on search query', () => {
    renderLanguageSelector();
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const searchInput = screen.getByPlaceholderText('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'en' } });

    const englishOptions = screen.getAllByRole('menuitem', { name: 'English' });
    expect(englishOptions.length).toBeGreaterThan(0);
    const spanishOptions = screen.queryAllByRole('menuitem', { name: 'Spanish' });
    expect(spanishOptions.length).toBe(0);
  });
});
