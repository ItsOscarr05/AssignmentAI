/// <reference types="cypress" />

// Extend Performance interface to include memory property
declare global {
  interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }

  interface Performance {
    memory?: PerformanceMemory;
  }
}

import { faker } from '@faker-js/faker';

describe('Performance Tests', () => {
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

  describe('Page Load Performance', () => {
    it('should load dashboard within performance budget', () => {
      cy.visit('/dashboard', {
        onBeforeLoad: win => {
          win.performance.mark('pageStart');
        },
      }).then(() => {
        cy.window().then(win => {
          win.performance.mark('pageEnd');
          win.performance.measure('pageLoad', 'pageStart', 'pageEnd');
          const pageLoadTime = win.performance.getEntriesByName('pageLoad')[0].duration;
          expect(pageLoadTime).to.be.lessThan(2000); // 2 seconds budget
        });
      });
    });

    it('should load assignment list within performance budget', () => {
      cy.visit('/assignments', {
        onBeforeLoad: win => {
          win.performance.mark('pageStart');
        },
      }).then(() => {
        cy.window().then(win => {
          win.performance.mark('pageEnd');
          win.performance.measure('pageLoad', 'pageStart', 'pageEnd');
          const pageLoadTime = win.performance.getEntriesByName('pageLoad')[0].duration;
          expect(pageLoadTime).to.be.lessThan(2500); // 2.5 seconds budget
        });
      });
    });
  });

  describe('API Response Times', () => {
    it('should fetch assignments within performance budget', () => {
      cy.request({
        method: 'GET',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.duration).to.be.lessThan(500); // 500ms budget
      });
    });

    it('should fetch user profile within performance budget', () => {
      cy.request({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.duration).to.be.lessThan(300); // 300ms budget
      });
    });
  });

  describe('Resource Usage', () => {
    it('should maintain stable memory usage during navigation', () => {
      cy.window().then(win => {
        const initialMemory = win.performance.memory?.usedJSHeapSize || 0;

        cy.visit('/dashboard');
        cy.visit('/assignments');
        cy.visit('/profile');

        cy.window().then(win => {
          const finalMemory = win.performance.memory?.usedJSHeapSize || 0;
          const memoryIncrease = finalMemory - initialMemory;
          expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024); // 50MB budget
        });
      });
    });

    it('should handle large lists without performance degradation', () => {
      // Create 100 test assignments
      const assignments = Array.from({ length: 100 }, (_, i) => ({
        title: `Test Assignment ${i}`,
        description: faker.lorem.paragraph(),
        dueDate: faker.date.future(),
        maxScore: faker.number.int({ min: 0, max: 100 }),
      }));

      cy.clock();
      cy.visit('/assignments');

      assignments.forEach(assignment => {
        cy.request({
          method: 'POST',
          url: '/api/assignments',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: assignment,
        });
      });

      cy.tick(1000); // Wait for 1 second

      cy.window().then(win => {
        const memoryUsage = win.performance.memory?.usedJSHeapSize || 0;
        expect(memoryUsage).to.be.lessThan(200 * 1024 * 1024); // 200MB budget
      });
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions', () => {
      cy.intercept('GET', '/api/assignments', req => {
        req.reply({
          delay: 1000,
          body: [],
        });
      });

      cy.visit('/assignments');
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/assignments', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });

      cy.visit('/assignments');
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Image Optimization', () => {
    it('should load optimized images', () => {
      cy.visit('/profile');
      cy.get('img').each($img => {
        cy.wrap($img).should('have.attr', 'loading', 'lazy');
        cy.wrap($img).should('have.attr', 'srcset');
      });
    });
  });

  describe('Caching Performance', () => {
    it('should utilize browser caching', () => {
      cy.request({
        method: 'GET',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(firstResponse => {
        const firstDuration = firstResponse.duration;

        cy.request({
          method: 'GET',
          url: '/api/assignments',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then(secondResponse => {
          const secondDuration = secondResponse.duration;
          expect(secondDuration).to.be.lessThan(firstDuration);
        });
      });
    });
  });
});
