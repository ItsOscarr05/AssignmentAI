describe('User Flows', () => {
  beforeEach(() => {
    cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`);
    cy.clearCookies();
  });

  describe('Dashboard Navigation', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123!@#');
    });

    it('should navigate through all dashboard sections', () => {
      cy.visit('/dashboard');

      // Check recent activity
      cy.get('[data-testid="recent-activity"]').should('be.visible');
      cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1);

      // Navigate to assignments
      cy.get('[data-testid="nav-assignments"]').click();
      cy.url().should('include', '/assignments');
      cy.get('[data-testid="assignment-list"]').should('be.visible');

      // Navigate to submissions
      cy.get('[data-testid="nav-submissions"]').click();
      cy.url().should('include', '/submissions');
      cy.get('[data-testid="submission-list"]').should('be.visible');

      // Navigate to analytics
      cy.get('[data-testid="nav-analytics"]').click();
      cy.url().should('include', '/analytics');
      cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
    });

    it('should filter and search assignments', () => {
      cy.visit('/assignments');

      // Use search
      cy.get('[data-testid="search-input"]').type('Test Assignment');
      cy.get('[data-testid="search-button"]').click();
      cy.get('[data-testid="assignment-card"]').should('contain', 'Test Assignment');

      // Use filters
      cy.get('[data-testid="filter-button"]').click();
      cy.get('[data-testid="status-filter"]').select('Submitted');
      cy.get('[data-testid="apply-filters"]').click();
      cy.get('[data-testid="assignment-card"]').should('have.length.at.least', 1);
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123!@#');
    });

    it('should update user profile', () => {
      cy.visit('/profile');

      // Update profile information
      cy.get('[data-testid="name-input"]').clear().type('Updated Name');
      cy.get('[data-testid="bio-input"]').clear().type('Updated bio information');
      cy.get('[data-testid="save-profile"]').click();

      // Verify updates
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="name-display"]').should('contain', 'Updated Name');
      cy.get('[data-testid="bio-display"]').should('contain', 'Updated bio information');
    });

    it('should update notification preferences', () => {
      cy.visit('/profile/notifications');

      // Toggle notification settings
      cy.get('[data-testid="email-notifications"]').click();
      cy.get('[data-testid="push-notifications"]').click();
      cy.get('[data-testid="save-preferences"]').click();

      // Verify updates
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="email-notifications"]').should('be.checked');
      cy.get('[data-testid="push-notifications"]').should('be.checked');
    });
  });

  describe('Feedback System', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123!@#');
    });

    it('should provide feedback on assignment', () => {
      cy.visit('/assignments');
      cy.get('[data-testid="assignment-card"]').first().click();

      // Add feedback
      cy.get('[data-testid="feedback-tab"]').click();
      cy.get('[data-testid="feedback-input"]').type('Detailed feedback on the assignment');
      cy.get('[data-testid="rating-input"]').type('4');
      cy.get('[data-testid="submit-feedback"]').click();

      // Verify feedback submission
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="feedback-display"]').should('contain', 'Detailed feedback');
    });

    it('should view feedback history', () => {
      cy.visit('/feedback');

      // Check feedback list
      cy.get('[data-testid="feedback-list"]').should('be.visible');
      cy.get('[data-testid="feedback-item"]').should('have.length.at.least', 1);

      // Filter feedback
      cy.get('[data-testid="filter-button"]').click();
      cy.get('[data-testid="rating-filter"]').select('4');
      cy.get('[data-testid="apply-filters"]').click();
      cy.get('[data-testid="feedback-item"]').should('have.length.at.least', 1);
    });
  });

  describe('Settings Management', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123!@#');
    });

    it('should update account settings', () => {
      cy.visit('/settings');

      // Update email preferences
      cy.get('[data-testid="email-frequency"]').select('Daily');
      cy.get('[data-testid="save-settings"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');

      // Update display settings
      cy.get('[data-testid="theme-select"]').select('Dark');
      cy.get('[data-testid="save-settings"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should manage connected accounts', () => {
      cy.visit('/settings/connections');

      // Connect new service
      cy.get('[data-testid="connect-github"]').click();
      cy.get('[data-testid="github-auth"]').should('be.visible');

      // Disconnect service
      cy.get('[data-testid="disconnect-service"]').first().click();
      cy.get('[data-testid="confirm-disconnect"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
});
