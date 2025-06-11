import DOMPurify from 'dompurify';
import { useCallback } from 'react';
import { z } from 'zod';

// Security headers configuration
export const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Input validation schemas
export const inputSchemas = {
  // User input validation
  userInput: z
    .string()
    .min(1, 'Input cannot be empty')
    .max(1000, 'Input is too long')
    .regex(/^[a-zA-Z0-9\s.,!?-]+$/, 'Input contains invalid characters'),

  // URL validation
  url: z
    .string()
    .url('Invalid URL format')
    .refine(url => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'Invalid URL protocol'),

  // Email validation
  email: z.string().email('Invalid email format').max(255, 'Email is too long'),

  // Password validation
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    ALLOW_DATA_ATTR: false,
  });
};

// XSS Protection
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// CSRF Token Management
export const csrfToken = {
  get: (): string | null => {
    return localStorage.getItem('csrfToken');
  },
  set: (token: string): void => {
    localStorage.setItem('csrfToken', token);
  },
  remove: (): void => {
    localStorage.removeItem('csrfToken');
  },
};

// Rate Limiting
interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.config.timeWindow);

    if (this.requests.length >= this.config.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  reset(): void {
    this.requests = [];
  }
}

// API Request Security
export const secureApiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = csrfToken.get();
  const headers = {
    ...options.headers,
    'X-CSRF-Token': token || '',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for CSRF
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response;
};

// Custom hook for secure form handling
export const useSecureForm = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => Promise<void>
) => {
  return useCallback(
    async (formData: FormData) => {
      try {
        const rawData = Object.fromEntries(formData.entries());
        const sanitizedData = Object.entries(rawData).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === 'string' ? sanitizeInput(value) : value,
          }),
          {}
        );

        const validatedData = schema.parse(sanitizedData);
        await onSubmit(validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    },
    [schema, onSubmit]
  );
};

// Example usage:
/*
const SecureForm: React.FC = () => {
  const handleSubmit = useSecureForm(
    inputSchemas.userInput,
    async (data) => {
      try {
        await secureApiRequest('/api/submit', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        // Handle success
      } catch (error) {
        // Handle error
      }
    }
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(new FormData(e.currentTarget));
    }}>
      <input type="text" name="userInput" />
      <button type="submit">Submit</button>
    </form>
  );
};

// Rate limiting example
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  timeWindow: 60000, // 1 minute
});

const makeApiRequest = async () => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded');
  }
  // Make API request
};
*/
