import axe from '@axe-core/react';
import DOMPurify from 'dompurify';
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Only run axe in development and when window is available
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Mock requestIdleCallback if it's not available
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = callback => {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1) as unknown as number;
    };
  }

  axe(React, 1000, 0, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    disableDeduplicate: true,
  });
}

// Configure DOMPurify
DOMPurify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
});

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  return (
    <HelmetProvider>
      <Helmet>
        {/* Content Security Policy */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={`
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval';
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https:;
            font-src 'self' data:;
            connect-src 'self' ${import.meta.env.VITE_API_URL};
          `}
        />

        {/* Other security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* HSTS - Ensure HTTPS */}
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

// Sanitize HTML utility function
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
  });
};

// CSRF token management
let csrfToken: string | null = null;

export const getCsrfToken = (): string | null => csrfToken;

export const setCsrfToken = (token: string): void => {
  csrfToken = token;
};

// Security utility hooks
export const useSecurityHeaders = () => {
  return {
    headers: {
      'X-CSRF-Token': getCsrfToken(),
      'Content-Type': 'application/json',
    },
  };
};

export const useContentSecurity = (content: string): string => {
  return React.useMemo(() => sanitizeHtml(content), [content]);
};

export default SecurityProvider;
