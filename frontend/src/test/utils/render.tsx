import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

interface AllTheProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
  includeRouter?: boolean;
}

const AllTheProviders = ({
  children,
  initialEntries = ['/'],
  includeRouter = true,
}: AllTheProvidersProps) => {
  const providers = (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  return includeRouter ? (
    <MemoryRouter initialEntries={initialEntries}>{providers}</MemoryRouter>
  ) : (
    providers
  );
};

interface CustomRenderOptions {
  route?: string;
  initialState?: Record<string, unknown>;
  includeRouter?: boolean;
}

const customRender = async (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  const { route = '/', includeRouter = true } = options;

  let result: ReturnType<typeof render>;
  await React.act(async () => {
    result = render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders initialEntries={[route]} includeRouter={includeRouter}>
          {children}
        </AllTheProviders>
      ),
      ...options,
    });
  });
  return result!;
};

// re-export everything
export * from '@testing-library/react';

// override render method and re-export act from React
export { React as act, customRender as render };
