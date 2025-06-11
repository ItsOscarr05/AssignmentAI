/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// Define types for user authentication
interface UserCredentials {
  email: string;
  password: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(user: UserCredentials): Chainable<void>;
    }
  }
}

// Custom command for logging in
Cypress.Commands.add('login', (user: UserCredentials) => {
  cy.session(
    user.email,
    () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type(user.password);
      cy.get('button[type="submit"]').click();

      // Handle 2FA
      cy.get('input[name="verificationCode"]').type('123456');
      cy.get('button[type="submit"]').click();

      // Verify successful login
      cy.url().should('include', '/dashboard');
    },
    {
      validate: () => {
        cy.getCookie('auth-token').should('exist');
      },
    }
  );
});

// Custom commands for common operations

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

// Create assignment command
Cypress.Commands.add('createAssignment', (title: string, description: string, dueDate: string) => {
  cy.visit('/assignments/new');
  cy.get('[data-testid="title-input"]').type(title);
  cy.get('[data-testid="description-input"]').type(description);
  cy.get('[data-testid="due-date-input"]').type(dueDate);
  cy.get('[data-testid="submit-button"]').click();
  cy.get('[data-testid="success-message"]').should('be.visible');
});

// Submit assignment command
Cypress.Commands.add('submitAssignment', (assignmentId: string, filePath: string) => {
  cy.visit(`/assignments/${assignmentId}`);
  cy.get('[data-testid="submit-assignment-button"]').click();
  cy.get('[data-testid="file-upload"]').attachFile(filePath);
  cy.get('[data-testid="submit-button"]').click();
  cy.get('[data-testid="success-message"]').should('be.visible');
});

// Provide feedback command
Cypress.Commands.add(
  'provideFeedback',
  (assignmentId: string, feedback: string, rating: number) => {
    cy.visit(`/assignments/${assignmentId}`);
    cy.get('[data-testid="feedback-tab"]').click();
    cy.get('[data-testid="feedback-input"]').type(feedback);
    cy.get('[data-testid="rating-input"]').type(rating.toString());
    cy.get('[data-testid="submit-feedback"]').click();
    cy.get('[data-testid="success-message"]').should('be.visible');
  }
);

// Update profile command
Cypress.Commands.add('updateProfile', (name: string, bio: string) => {
  cy.visit('/profile');
  cy.get('[data-testid="name-input"]').clear().type(name);
  cy.get('[data-testid="bio-input"]').clear().type(bio);
  cy.get('[data-testid="save-profile"]').click();
  cy.get('[data-testid="success-message"]').should('be.visible');
});

// Update settings command
Cypress.Commands.add('updateSettings', (settings: { emailFrequency?: string; theme?: string }) => {
  cy.visit('/settings');
  if (settings.emailFrequency) {
    cy.get('[data-testid="email-frequency"]').select(settings.emailFrequency);
  }
  if (settings.theme) {
    cy.get('[data-testid="theme-select"]').select(settings.theme);
  }
  cy.get('[data-testid="save-settings"]').click();
  cy.get('[data-testid="success-message"]').should('be.visible');
});

// Mock API response command
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any) => {
  cy.intercept(method, url, {
    statusCode: 200,
    body: response,
  });
});

// Mock API error command
Cypress.Commands.add('mockApiError', (method: string, url: string, statusCode: number = 500) => {
  cy.intercept(method, url, {
    statusCode,
    body: { error: 'API Error' },
  });
});

// Clear all data command
Cypress.Commands.add('clearAllData', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`);
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Wait for loading to complete command
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});

// Check for error message command
Cypress.Commands.add('checkErrorMessage', (message: string) => {
  cy.get('[data-testid="error-message"]').should('contain', message);
});

// Check for success message command
Cypress.Commands.add('checkSuccessMessage', (message: string) => {
  cy.get('[data-testid="success-message"]').should('contain', message);
});

// Type with delay command (for testing input behavior)
Cypress.Commands.add('typeWithDelay', (selector: string, text: string, delay: number = 100) => {
  text.split('').forEach(char => {
    cy.get(selector).type(char, { delay });
  });
});

// Drag and drop command
Cypress.Commands.add('dragAndDrop', (subject: string, target: string) => {
  cy.get(subject).trigger('mousedown', { which: 1 });
  cy.get(target).trigger('mousemove').trigger('mouseup', { force: true });
});

// Check accessibility command
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Custom type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createAssignment(title: string, description: string, dueDate: string): Chainable<void>;
      submitAssignment(assignmentId: string, filePath: string): Chainable<void>;
      provideFeedback(assignmentId: string, feedback: string, rating: number): Chainable<void>;
      updateProfile(name: string, bio: string): Chainable<void>;
      updateSettings(settings: { emailFrequency?: string; theme?: string }): Chainable<void>;
      mockApiResponse(method: string, url: string, response: any): Chainable<void>;
      mockApiError(method: string, url: string, statusCode?: number): Chainable<void>;
      clearAllData(): Chainable<void>;
      waitForLoading(): Chainable<void>;
      checkErrorMessage(message: string): Chainable<void>;
      checkSuccessMessage(message: string): Chainable<void>;
      typeWithDelay(selector: string, text: string, delay?: number): Chainable<void>;
      dragAndDrop(subject: string, target: string): Chainable<void>;
      checkA11y(): Chainable<void>;
    }
  }
}

export {};
