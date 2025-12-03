import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityProvider, getCsrfToken, sanitizeHtml, setCsrfToken } from '../SecurityProvider';

// Mock @axe-core/react
vi.mock('@axe-core/react', () => ({
  default: vi.fn(),
  axe: vi.fn(),
}));

describe('SecurityProvider', () => {
  it('renders children without modification', () => {
    const { getByText } = render(
      <SecurityProvider>
        <div>Test Child</div>
      </SecurityProvider>
    );
    expect(getByText('Test Child')).toBeTruthy();
  });

  it('provides CSRF token functionality', () => {
    const testToken = 'test-csrf-token';
    setCsrfToken(testToken);
    expect(getCsrfToken()).toBe(testToken);
  });

  it('sanitizes HTML content', () => {
    const unsafeHtml = '<script>alert("xss")</script><p>Safe content</p>';
    const sanitized = sanitizeHtml(unsafeHtml);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Safe content</p>');
  });
});

describe('Security Utilities', () => {
  describe('sanitizeHtml', () => {
    it('removes dangerous HTML', () => {
      const dirty = '<p>Safe text</p><script>alert("xss")</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<p>Safe text</p>');
    });

    it('allows safe HTML', () => {
      const safe = '<p><strong>Safe</strong> <em>text</em></p>';
      const result = sanitizeHtml(safe);
      expect(result).toBe(safe);
    });
  });

  describe('CSRF Token Management', () => {
    beforeEach(() => {
      // Reset CSRF token before each test
      setCsrfToken('');
    });

    it('manages CSRF token', () => {
      expect(getCsrfToken()).toBe('');

      const token = 'test-csrf-token';
      setCsrfToken(token);
      expect(getCsrfToken()).toBe(token);
    });
  });
});
