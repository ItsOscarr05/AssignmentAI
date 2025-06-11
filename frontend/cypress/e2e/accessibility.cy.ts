/// <reference types="cypress" />

// Extend Cypress Chainable interface to include tab command
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      tab(options?: Partial<{ shift: boolean }>): Chainable<Subject>;
    }
  }
}

import { faker } from '@faker-js/faker';

describe('Accessibility Tests', () => {
  const user = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
  };

  let authToken: string;

  before(() => {
    // Create test user
    cy.request('POST', '/api/auth/register', user);

    // Login to get auth token
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: user.email,
        password: user.password,
      },
    }).then(response => {
      authToken = response.body.token;
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA labels on form inputs', () => {
      cy.visit('/assignments/new');

      cy.get('input[name="title"]').should('have.attr', 'aria-label', 'Assignment Title');
      cy.get('textarea[name="description"]').should('have.attr', 'aria-label', 'Description');
      cy.get('input[name="dueDate"]').should('have.attr', 'aria-label', 'Due Date');
      cy.get('input[name="maxScore"]').should('have.attr', 'aria-label', 'Maximum Score');
    });

    it('should announce dynamic content changes', () => {
      cy.visit('/assignments');

      cy.get('[data-testid="assignment-list"]').should('have.attr', 'aria-live', 'polite');
      cy.get('[data-testid="loading-spinner"]').should('have.attr', 'aria-live', 'polite');
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/assignments');

      cy.get('h1').should('exist');
      cy.get('h2').should('exist');
      cy.get('h3').should('exist');

      // Verify heading order
      cy.get('h1').then($h1 => {
        cy.get('h2').then($h2 => {
          expect($h1.index()).to.be.lessThan($h2.index());
        });
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be navigable using keyboard', () => {
      cy.visit('/assignments');

      // Tab through all interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'role', 'banner');

      cy.focused().tab();
      cy.focused().should('have.attr', 'role', 'navigation');

      cy.focused().tab();
      cy.focused().should('have.attr', 'role', 'main');
    });

    it('should have visible focus indicators', () => {
      cy.visit('/assignments');

      cy.get('button').first().focus();
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');
    });

    it('should handle keyboard shortcuts', () => {
      cy.visit('/assignments');

      // Test search shortcut
      cy.get('body').type('{ctrl}k');
      cy.focused().should('have.attr', 'aria-label', 'Search assignments');
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG contrast requirements', () => {
      cy.visit('/assignments');

      // Test text contrast
      cy.get('body').then($body => {
        const textColor = window.getComputedStyle($body[0]).color;
        const backgroundColor = window.getComputedStyle($body[0]).backgroundColor;
        // Use a contrast checking library or custom function
        expect(checkContrast(textColor, backgroundColor)).to.be.true;
      });
    });

    it('should maintain contrast in different themes', () => {
      cy.visit('/assignments');

      // Switch to dark theme
      cy.get('[data-testid="theme-toggle"]').click();

      // Test text contrast in dark theme
      cy.get('body').then($body => {
        const textColor = window.getComputedStyle($body[0]).color;
        const backgroundColor = window.getComputedStyle($body[0]).backgroundColor;
        expect(checkContrast(textColor, backgroundColor)).to.be.true;
      });
    });
  });

  describe('ARIA Compliance', () => {
    it('should have proper ARIA roles', () => {
      cy.visit('/assignments');

      cy.get('header').should('have.attr', 'role', 'banner');
      cy.get('nav').should('have.attr', 'role', 'navigation');
      cy.get('main').should('have.attr', 'role', 'main');
      cy.get('footer').should('have.attr', 'role', 'contentinfo');
    });

    it('should have proper ARIA states', () => {
      cy.visit('/assignments');

      // Test modal
      cy.get('[data-testid="create-assignment-button"]').click();
      cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
      cy.get('[role="dialog"]').should('have.attr', 'aria-hidden', 'false');
    });

    it('should handle dynamic ARIA attributes', () => {
      cy.visit('/assignments');

      // Test loading state
      cy.get('[data-testid="loading-spinner"]').should('have.attr', 'aria-busy', 'true');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="assignment-list"]').should('have.attr', 'aria-busy', 'false');
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels', () => {
      cy.visit('/assignments/new');

      cy.get('label[for="title"]').should('exist');
      cy.get('label[for="description"]').should('exist');
      cy.get('label[for="dueDate"]').should('exist');
      cy.get('label[for="maxScore"]').should('exist');
    });

    it('should show validation errors properly', () => {
      cy.visit('/assignments/new');

      cy.get('button[type="submit"]').click();

      cy.get('input[name="title"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('input[name="title"]').should('have.attr', 'aria-describedby');
    });

    it('should handle required fields', () => {
      cy.visit('/assignments/new');

      cy.get('input[name="title"]').should('have.attr', 'required');
      cy.get('input[name="dueDate"]').should('have.attr', 'required');
    });
  });

  describe('Image Accessibility', () => {
    it('should have proper alt text for images', () => {
      cy.visit('/profile');

      cy.get('img').each($img => {
        cy.wrap($img).should('have.attr', 'alt');
        cy.wrap($img).should('not.have.attr', 'alt', '');
      });
    });

    it('should handle decorative images properly', () => {
      cy.visit('/profile');

      cy.get('img[role="presentation"]').should('have.attr', 'aria-hidden', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should announce errors to screen readers', () => {
      cy.visit('/assignments');

      cy.intercept('GET', '/api/assignments', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });

      cy.get('[data-testid="error-message"]').should('have.attr', 'role', 'alert');
      cy.get('[data-testid="error-message"]').should('have.attr', 'aria-live', 'assertive');
    });
  });
});

// Helper function to check contrast ratio
function checkContrast(color1: string, color2: string): boolean {
  // Convert colors to RGB
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  // Calculate relative luminance
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  // Calculate contrast ratio
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // WCAG 2.0 requires a contrast ratio of at least 4.5:1 for normal text
  return ratio >= 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(val => {
    if (val <= 0.03928) {
      return val / 12.92;
    } else {
      return Math.pow((val + 0.055) / 1.055, 2.4);
    }
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
