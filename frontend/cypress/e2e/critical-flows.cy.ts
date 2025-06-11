describe('Critical User Flows', () => {
  beforeEach(() => {
    // Reset database and clear cookies before each test
    cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`);
    cy.clearCookies();
  });

  describe('Authentication Flow', () => {
    it('should allow user registration and login', () => {
      const testUser = {
        email: `test${Date.now()}@example.com`,
        password: 'Test123!@#',
        name: 'Test User',
      };

      // Register
      cy.visit('/register');
      cy.get('[data-testid="name-input"]').type(testUser.name);
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="register-button"]').click();

      // Verify registration success
      cy.url().should('include', '/login');
      cy.get('[data-testid="success-message"]').should('be.visible');

      // Login
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="login-button"]').click();

      // Verify login success
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle invalid login attempts', () => {
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('invalid@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();

      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.url().should('include', '/login');
    });
  });

  describe('Assignment Management Flow', () => {
    beforeEach(() => {
      // Login before each test
      cy.login('test@example.com', 'Test123!@#');
    });

    it('should create and submit an assignment', () => {
      // Create assignment
      cy.visit('/assignments/new');
      cy.get('[data-testid="title-input"]').type('Test Assignment');
      cy.get('[data-testid="description-input"]').type('Test Description');
      cy.get('[data-testid="due-date-input"]').type('2024-12-31');
      cy.get('[data-testid="submit-button"]').click();

      // Verify assignment creation
      cy.url().should('include', '/assignments');
      cy.get('[data-testid="success-message"]').should('be.visible');

      // Submit assignment
      cy.get('[data-testid="assignment-card"]').first().click();
      cy.get('[data-testid="submit-assignment-button"]').click();
      cy.get('[data-testid="file-upload"]').attachFile('test.pdf');
      cy.get('[data-testid="submit-button"]').click();

      // Verify submission
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="submission-status"]').should('contain', 'Submitted');
    });

    it('should handle assignment feedback', () => {
      // Navigate to submitted assignment
      cy.visit('/assignments');
      cy.get('[data-testid="submitted-tab"]').click();
      cy.get('[data-testid="assignment-card"]').first().click();

      // Add feedback
      cy.get('[data-testid="feedback-input"]').type('Great work!');
      cy.get('[data-testid="rating-input"]').type('5');
      cy.get('[data-testid="submit-feedback-button"]').click();

      // Verify feedback submission
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="feedback-display"]').should('contain', 'Great work!');
    });
  });

  describe('AI Analysis Flow', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123!@#');
    });

    it('should analyze submission and generate feedback', () => {
      // Navigate to submission
      cy.visit('/submissions');
      cy.get('[data-testid="submission-card"]').first().click();

      // Request AI analysis
      cy.get('[data-testid="analyze-button"]').click();
      cy.get('[data-testid="analysis-loading"]').should('be.visible');
      cy.get('[data-testid="analysis-results"]', { timeout: 30000 }).should('be.visible');

      // Verify analysis results
      cy.get('[data-testid="plagiarism-score"]').should('exist');
      cy.get('[data-testid="suggested-grade"]').should('exist');
      cy.get('[data-testid="feedback-suggestions"]').should('exist');
    });

    it('should handle analysis errors gracefully', () => {
      // Mock API error
      cy.intercept('POST', '/api/analyze', {
        statusCode: 500,
        body: { error: 'Analysis failed' },
      });

      // Navigate to submission
      cy.visit('/submissions');
      cy.get('[data-testid="submission-card"]').first().click();

      // Request AI analysis
      cy.get('[data-testid="analyze-button"]').click();
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('GET', '/api/assignments', {
        forceNetworkError: true,
      });

      cy.visit('/assignments');
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle concurrent submissions', () => {
      cy.login('test@example.com', 'Test123!@#');
      cy.visit('/assignments/new');

      // Start first submission
      cy.get('[data-testid="title-input"]').type('First Assignment');
      cy.get('[data-testid="description-input"]').type('First Description');

      // Open new tab and start second submission
      cy.window().then(win => {
        win.open('/assignments/new', '_blank');
      });

      // Complete first submission
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');

      // Switch to second tab and complete submission
      cy.window().then(win => {
        win.focus();
      });
      cy.get('[data-testid="title-input"]').type('Second Assignment');
      cy.get('[data-testid="description-input"]').type('Second Description');
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle large file uploads', () => {
      cy.login('test@example.com', 'Test123!@#');
      cy.visit('/assignments/new');

      // Create assignment
      cy.get('[data-testid="title-input"]').type('Large File Test');
      cy.get('[data-testid="description-input"]').type('Testing large file upload');
      cy.get('[data-testid="submit-button"]').click();

      // Upload large file
      cy.get('[data-testid="file-upload"]').attachFile('large-file.pdf');
      cy.get('[data-testid="upload-progress"]').should('be.visible');
      cy.get('[data-testid="upload-success"]', { timeout: 60000 }).should('be.visible');
    });
  });
});
