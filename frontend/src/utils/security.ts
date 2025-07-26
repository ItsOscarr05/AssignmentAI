/**
 * Security utilities for input validation, sanitization, and security checks
 */

// XSS Prevention
export class XSSPrevention {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Escape HTML special characters
   */
  static escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, m => map[m]);
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeURL(url: string): string | null {
    try {
      const parsed = new URL(url);
      // Only allow http, https, and mailto protocols
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Check if string contains potentially dangerous content
   */
  static containsDangerousContent(text: string): boolean {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];

    return dangerousPatterns.some(pattern => pattern.test(text));
  }
}

// Input Validation
export class InputValidation {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Missing character types
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    // Sequential characters check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password contains too many repeated characters');
      score = Math.max(0, score - 1);
    }

    const isValid = errors.length === 0 && score >= 3;
    return { isValid, errors, score };
  }

  /**
   * Validate username format
   */
  static isValidUsername(username: string): boolean {
    // 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    // Basic international phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate 2FA code format
   */
  static isValid2FACode(code: string): boolean {
    // 6-digit numeric code
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Validate backup code format
   */
  static isValidBackupCode(code: string): boolean {
    // 8-character alphanumeric code
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  }

  /**
   * Validate file type
   */
  static isValidFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file size
   */
  static isValidFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

// CSRF Protection
export class CSRFProtection {
  private static tokenKey = 'csrf_token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store CSRF token
   */
  static storeToken(token: string): void {
    try {
      sessionStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Failed to store CSRF token:', error);
    }
  }

  /**
   * Get stored CSRF token
   */
  static getToken(): string | null {
    try {
      return sessionStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    try {
      sessionStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to clear CSRF token:', error);
    }
  }
}

// Rate Limiting
export class RateLimiting {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if action is rate limited
   */
  static isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      // Reset or create new attempt record
      this.attempts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return false;
    }

    if (attempt.count >= maxAttempts) {
      return true;
    }

    // Increment attempt count
    attempt.count++;
    return false;
  }

  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(key: string, maxAttempts: number): number {
    const attempt = this.attempts.get(key);
    if (!attempt || Date.now() > attempt.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - attempt.count);
  }

  /**
   * Get time until reset
   */
  static getTimeUntilReset(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;

    const now = Date.now();
    return Math.max(0, attempt.resetTime - now);
  }

  /**
   * Clear rate limiting for a key
   */
  static clear(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limiting
   */
  static clearAll(): void {
    this.attempts.clear();
  }
}

// Content Security Policy
export class CSP {
  /**
   * Generate nonce for CSP
   */
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSP header
   */
  static validateCSPHeader(header: string): boolean {
    const requiredDirectives = ['default-src', 'script-src', 'style-src'];
    const directives = header.split(';').map(d => d.trim().split(' ')[0]);

    return requiredDirectives.every(directive => directives.includes(directive));
  }
}

// Secure Storage
export class SecureStorage {
  /**
   * Encrypt data before storage
   */
  static async encrypt(data: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Generate key from password
      const keyBuffer = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        dataBuffer
      );

      const encryptedArray = new Uint8Array(encrypted);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data from storage
   */
  static async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      // Generate key from password
      const keyBuffer = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, derivedKey, data);

      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Security Headers
export class SecurityHeaders {
  /**
   * Validate security headers
   */
  static validateHeaders(headers: Headers): {
    isValid: boolean;
    missing: string[];
    recommendations: string[];
  } {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
    ];

    const recommendedHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'Permissions-Policy',
    ];

    const missing: string[] = [];
    const recommendations: string[] = [];

    requiredHeaders.forEach(header => {
      if (!headers.has(header)) {
        missing.push(header);
      }
    });

    recommendedHeaders.forEach(header => {
      if (!headers.has(header)) {
        recommendations.push(header);
      }
    });

    return {
      isValid: missing.length === 0,
      missing,
      recommendations,
    };
  }
}

// Export all security utilities
export const SecurityUtils = {
  XSSPrevention,
  InputValidation,
  CSRFProtection,
  RateLimiting,
  CSP,
  SecureStorage,
  SecurityHeaders,
};

export default SecurityUtils;
