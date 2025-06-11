/// <reference types="cypress" />

import { faker } from '@faker-js/faker';
import '@testing-library/cypress/add-commands';

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  const testUser = {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    name: faker.person.fullName(),
  };

  describe('Registration', () => {
    it('should successfully register a new user', () => {
      // Visit the registration page
      cy.visit('/register');

      // Fill in the registration form
      cy.get('input[name="name"]').type(testUser.name);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="confirmPassword"]').type(testUser.password);

      // Accept terms
      cy.get('input[name="terms"]').click();

      // Submit the form
      cy.get('button[type="submit"]').click();

      // Should be redirected to 2FA setup
      cy.url().should('include', '/2fa-setup');
      cy.contains('Scan this QR code').should('be.visible');

      // Verify 2FA setup
      cy.get('input[name="verificationCode"]').type('123456');
      cy.get('button[type="submit"]').click();

      // Should be redirected to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-name"]').should('contain', testUser.name);
    });

    it('should show validation errors for invalid registration', () => {
      cy.visit('/register');

      // Try to submit empty form
      cy.get('button[type="submit"]').click();

      // Check validation messages
      cy.contains('Name is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
      cy.contains('Must accept terms').should('be.visible');

      // Try weak password
      cy.get('input[name="password"]').type('123');
      cy.contains('Password must be at least').should('be.visible');

      // Try invalid email
      cy.get('input[name="email"]').type('invalid-email');
      cy.contains('Invalid email').should('be.visible');

      // Try mismatched passwords
      cy.get('input[name="password"]').clear().type('StrongPass123!');
      cy.get('input[name="confirmPassword"]').type('DifferentPass123!');
      cy.contains('Passwords do not match').should('be.visible');
    });
  });

  describe('Login', () => {
    beforeEach(() => {
      // Create a test user before each login test
      cy.request('POST', '/api/auth/register', testUser);
    });

    it('should successfully login with valid credentials', () => {
      cy.visit('/login');

      // Fill in login form
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);

      // Submit form
      cy.get('button[type="submit"]').click();

      // Should be prompted for 2FA
      cy.contains('Two-factor authentication').should('be.visible');
      cy.get('input[name="verificationCode"]').type('123456');
      cy.get('button[type="submit"]').click();

      // Should be redirected to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-name"]').should('contain', testUser.name);
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');

      // Try invalid password
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.contains('Invalid credentials').should('be.visible');
    });

    it('should show error for invalid 2FA code', () => {
      cy.visit('/login');

      // Login with correct credentials
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();

      // Try invalid 2FA code
      cy.get('input[name="verificationCode"]').type('000000');
      cy.get('button[type="submit"]').click();

      // Should show error message
      cy.contains('Invalid code').should('be.visible');
    });
  });

  describe('Password Reset', () => {
    it('should handle forgot password flow', () => {
      cy.visit('/forgot-password');

      // Request password reset
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('button[type="submit"]').click();

      // Should show success message
      cy.contains('Check your email').should('be.visible');

      // Simulate clicking reset link (this would normally be in email)
      cy.visit(`/reset-password?token=test-token`);

      // Set new password
      const newPassword = faker.internet.password({ length: 12 });
      cy.get('input[name="newPassword"]').type(newPassword);
      cy.get('input[name="confirmPassword"]').type(newPassword);
      cy.get('button[type="submit"]').click();

      // Should show success and redirect to login
      cy.contains('Password updated').should('be.visible');
      cy.url().should('include', '/login');

      // Try logging in with new password
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(newPassword);
      cy.get('button[type="submit"]').click();

      // Should proceed to 2FA
      cy.contains('Two-factor authentication').should('be.visible');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      // Log in before each test
      cy.login(testUser);
    });

    it('should list active sessions', () => {
      cy.visit('/settings/sessions');

      // Should show current session
      cy.contains('Current session').should('be.visible');
      cy.contains(new RegExp(Cypress.browser.name, 'i')).should('be.visible');
    });

    it('should be able to revoke sessions', () => {
      cy.visit('/settings/sessions');

      // Revoke all other sessions
      cy.get('button').contains('Revoke all').click();
      cy.get('button').contains('Confirm').click();

      // Should show success message
      cy.contains('Sessions revoked').should('be.visible');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login(testUser);
    });

    it('should successfully logout', () => {
      cy.visit('/dashboard');

      // Click logout button
      cy.get('button').contains('Logout').click();

      // Should be redirected to login
      cy.url().should('include', '/login');

      // Try accessing protected route
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
});
