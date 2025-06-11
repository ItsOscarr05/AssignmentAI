/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />

import { faker } from '@faker-js/faker';

// Define types for test data
interface TestUser {
  email: string;
  password: string;
  name: string;
}

interface ApiError {
  error: string;
}

describe('Error Handling Tests', () => {
  const testUser: TestUser = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
  };

  let authToken: string;

  before(() => {
    // Create test user
    cy.request('POST', '/api/auth/register', testUser);

    // Login to get auth token
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    }).then((response: Cypress.Response<{ token: string }>) => {
      authToken = response.body.token;
    });
  });

  describe('Network Errors', () => {
    it('should handle offline state', () => {
      cy.visit('/assignments');

      cy.window().then((win: Window) => {
        cy.stub(win.navigator, 'onLine').value(false);
        cy.trigger('offline');
      });

      cy.get('[data-testid="offline-message"]').should('be.visible');
      cy.get('[data-testid="offline-message"]').should('contain', 'You are offline');
    });

    it('should handle server errors', () => {
      cy.intercept('GET', '/api/assignments', {
        statusCode: 500,
        body: { error: 'Internal Server Error' } as ApiError,
      });

      cy.visit('/assignments');

      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Something went wrong');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle timeout errors', () => {
      cy.intercept('GET', '/api/assignments', req => {
        req.reply({
          delay: 10000,
          body: [] as any[],
        });
      });

      cy.visit('/assignments');

      cy.get('[data-testid="timeout-message"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="timeout-message"]').should('contain', 'Request timed out');
    });
  });

  describe('Validation Errors', () => {
    it('should handle form validation errors', () => {
      cy.visit('/assignments/new');

      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="title-error"]').should('be.visible');
      cy.get('[data-testid="title-error"]').should('contain', 'Title is required');

      cy.get('[data-testid="dueDate-error"]').should('be.visible');
      cy.get('[data-testid="dueDate-error"]').should('contain', 'Due date is required');
    });

    it('should handle file validation errors', () => {
      cy.visit('/assignments/new');

      const invalidFile = {
        fileContent: new Blob(['test content'], { type: 'application/x-msdownload' }),
        fileName: 'test.exe',
        mimeType: 'application/x-msdownload',
      };

      cy.get('input[type="file"]').attachFile(invalidFile);

      cy.get('[data-testid="file-error"]').should('be.visible');
      cy.get('[data-testid="file-error"]').should('contain', 'Invalid file type');
    });

    it('should handle date validation errors', () => {
      cy.visit('/assignments/new');

      cy.get('input[name="dueDate"]').type('2020-01-01');

      cy.get('[data-testid="dueDate-error"]').should('be.visible');
      cy.get('[data-testid="dueDate-error"]').should('contain', 'Due date must be in the future');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle invalid credentials', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type('wrong-password');
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="auth-error"]').should('be.visible');
      cy.get('[data-testid="auth-error"]').should('contain', 'Invalid credentials');
    });

    it('should handle expired token', () => {
      cy.request({
        method: 'GET',
        url: '/api/assignments',
        headers: {
          Authorization: 'Bearer expired-token',
        },
        failOnStatusCode: false,
      }).then((response: Cypress.Response<ApiError>) => {
        expect(response.status).to.equal(401);
        expect(response.body.error).to.include('token expired');
      });
    });

    it('should handle invalid token', () => {
      cy.request({
        method: 'GET',
        url: '/api/assignments',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        failOnStatusCode: false,
      }).then((response: Cypress.Response<ApiError>) => {
        expect(response.status).to.equal(401);
        expect(response.body.error).to.include('invalid token');
      });
    });
  });

  describe('Resource Not Found', () => {
    it('should handle non-existent assignments', () => {
      cy.visit('/assignments/non-existent-id');

      cy.get('[data-testid="not-found"]').should('be.visible');
      cy.get('[data-testid="not-found"]').should('contain', 'Assignment not found');
    });

    it('should handle non-existent user profiles', () => {
      cy.visit('/users/non-existent-id');

      cy.get('[data-testid="not-found"]').should('be.visible');
      cy.get('[data-testid="not-found"]').should('contain', 'User not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit exceeded', () => {
      for (let i = 0; i < 100; i++) {
        cy.request({
          method: 'POST',
          url: '/api/assignments',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            title: `Test Assignment ${i}`,
            description: faker.lorem.paragraph(),
            dueDate: faker.date.future().toISOString(),
            maxScore: 100,
          },
          failOnStatusCode: false,
        });
      }

      cy.get('[data-testid="rate-limit-error"]').should('be.visible');
      cy.get('[data-testid="rate-limit-error"]').should('contain', 'Rate limit exceeded');
    });
  });

  describe('Error Recovery', () => {
    it('should allow retrying failed requests', () => {
      cy.intercept('GET', '/api/assignments', {
        statusCode: 500,
        body: { error: 'Internal Server Error' } as ApiError,
      });

      cy.visit('/assignments');

      cy.get('[data-testid="retry-button"]').click();

      cy.intercept('GET', '/api/assignments', {
        statusCode: 200,
        body: [] as any[],
      });

      cy.get('[data-testid="assignment-list"]').should('be.visible');
    });

    it('should handle form recovery after error', () => {
      cy.visit('/assignments/new');

      cy.get('input[name="title"]').type('Test Assignment');
      cy.get('textarea[name="description"]').type('Test Description');

      cy.intercept('POST', '/api/assignments', {
        statusCode: 500,
        body: { error: 'Internal Server Error' } as ApiError,
      });

      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="error-message"]').should('be.visible');

      cy.get('input[name="title"]').should('have.value', 'Test Assignment');
      cy.get('textarea[name="description"]').should('have.value', 'Test Description');
    });
  });

  describe('Error Logging', () => {
    it('should log errors to error tracking service', () => {
      cy.intercept('GET', '/api/assignments', {
        statusCode: 500,
        body: { error: 'Internal Server Error' } as ApiError,
      });

      cy.visit('/assignments');

      cy.window().then((win: Window) => {
        const consoleError = cy.stub(win.console, 'error');
        expect(consoleError).to.be.calledWith('Failed to fetch assignments');
      });
    });
  });
});
