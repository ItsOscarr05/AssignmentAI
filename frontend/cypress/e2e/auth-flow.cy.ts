describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should complete full registration and login flow', () => {
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'password123';

    // Step 1: Navigate to registration page
    cy.visit('/register');
    cy.get('h4').should('contain', 'Create Account');

    // Step 2: Fill out registration form
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('input[name="confirmPassword"]').type(testPassword);

    // Step 3: Submit registration
    cy.get('button[type="submit"]').click();

    // Step 4: Verify success message
    cy.get('[role="alert"]').should('contain', 'Registration successful!');

    // Step 5: Wait for redirect to login page
    cy.url().should('include', '/login');

    // Step 6: Fill out login form
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);

    // Step 7: Submit login
    cy.get('button[type="submit"]').click();

    // Step 8: Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should show validation errors for invalid registration data', () => {
    cy.visit('/register');

    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should('contain', 'All fields are required');

    // Test invalid email
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should('contain', 'Invalid email format');

    // Test password mismatch
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').clear().type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('different123');
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should('contain', 'Passwords do not match');
  });

  it('should show validation errors for invalid login data', () => {
    cy.visit('/login');

    // Test invalid email format
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="email"]').blur();
    cy.get('p').should('contain', 'Invalid email address');

    // Test short password
    cy.get('input[name="password"]').type('12345');
    cy.get('input[name="password"]').blur();
    cy.get('p').should('contain', 'Password must be at least 6 characters');
  });

  it('should handle login with non-existent user', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type('nonexistent@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.get('[role="alert"]').should('contain', 'Invalid credentials');
  });

  it('should redirect OAuth buttons to correct endpoints', () => {
    cy.visit('/register');

    // Mock window.location.href
    cy.window().then(win => {
      cy.stub(win, 'location', {
        href: '',
        assign: cy.stub().as('locationAssign'),
      });
    });

    // Test Google OAuth button
    cy.get('button').contains('Google').click();
    cy.window().its('location.href').should('contain', '/api/auth/google/login');

    // Test GitHub OAuth button
    cy.get('button').contains('GitHub').click();
    cy.window().its('location.href').should('contain', '/api/auth/github/login');
  });

  it('should persist user session after page reload', () => {
    // First register and login
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'password123';

    cy.visit('/register');
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('input[name="confirmPassword"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for redirect and login
    cy.url().should('include', '/login');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Verify we're on dashboard
    cy.url().should('include', '/dashboard');

    // Reload the page
    cy.reload();

    // Should still be on dashboard (session persisted)
    cy.url().should('include', '/dashboard');
  });

  it('should logout and clear session', () => {
    // First login (assuming user exists)
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Should be on dashboard
    cy.url().should('include', '/dashboard');

    // Find and click logout button (adjust selector based on your UI)
    cy.get('[data-testid="logout-button"]').click();

    // Should redirect to login page
    cy.url().should('include', '/login');

    // Try to access dashboard directly
    cy.visit('/dashboard');

    // Should redirect back to login (no session)
    cy.url().should('include', '/login');
  });
});
