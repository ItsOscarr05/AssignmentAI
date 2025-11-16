import '@testing-library/jest-dom';

import type { RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import type { MemoryRouterProps } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { AuthProvider } from '../contexts/AuthContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { ThemeProvider } from '../theme/ThemeProvider';

type CustomRenderOptions = RenderOptions & {
  route?: string;
  memoryRouterProps?: MemoryRouterProps;
  queryClient?: QueryClient;
};

vi.mock('@testing-library/react', async () => {
  const actual = await vi.importActual<typeof import('@testing-library/react')>(
    '@testing-library/react'
  );

  const defaultQueryOptions = {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  };

  return {
    ...actual,
    render: (ui: ReactElement, options: CustomRenderOptions = {}) => {
      const {
        route = '/',
        memoryRouterProps,
        queryClient = new QueryClient({ defaultOptions: defaultQueryOptions }),
        ...rtlOptions
      } = options;

      const routerProps: MemoryRouterProps = {
        ...(memoryRouterProps ?? {}),
      };

      if (!routerProps.initialEntries) {
        routerProps.initialEntries = [route];
      }

      const Wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter {...routerProps}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SnackbarProvider>
                <AuthProvider>{children}</AuthProvider>
              </SnackbarProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </MemoryRouter>
      );

      const result = actual.render(ui, {
        wrapper: Wrapper,
        ...rtlOptions,
      });

      return {
        ...result,
        queryClient,
      };
    },
  };
});

declare global {
  interface Window {
    ResizeObserver?: typeof ResizeObserver;
  }
}

// Polyfill matchMedia for components that rely on it
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// Provide a minimal ResizeObserver implementation
if (!('ResizeObserver' in window)) {
  class ResizeObserver {
    callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe() {
      // no-op
    }

    unobserve() {
      // no-op
    }

    disconnect() {
      // no-op
    }
  }

  window.ResizeObserver = ResizeObserver;
}

// Polyfill IntersectionObserver where needed
if (!('IntersectionObserver' in window)) {
  class IntersectionObserver {
    callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe() {
      // no-op
    }

    unobserve() {
      // no-op
    }

    disconnect() {
      // no-op
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  // @ts-expect-error assigning polyfill
  window.IntersectionObserver = IntersectionObserver;
}

// Stub scrollTo to avoid jsdom warnings
if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}

// Provide createObjectURL for tests that use file APIs
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'mock-object-url');
}

vi.mock('@stripe/stripe-js', () => {
  const mockElements = {
    create: vi.fn(),
    getElement: vi.fn(),
    submit: vi.fn(),
  };

  const mockStripe = {
    elements: vi.fn(() => mockElements),
    createToken: vi.fn(),
    createPaymentMethod: vi.fn(),
    confirmCardPayment: vi.fn(),
    confirmSetup: vi.fn(),
  };

  return {
    loadStripe: vi.fn().mockResolvedValue(mockStripe),
  };
});

if (!('Stripe' in window)) {
  // @ts-expect-error assigning mock implementation for tests
  window.Stripe = () => ({
    elements: () => ({
      create: vi.fn(),
      getElement: vi.fn(),
      submit: vi.fn(),
    }),
  });
}


