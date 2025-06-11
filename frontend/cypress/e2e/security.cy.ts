import { faker } from '@faker-js/faker';

describe('Security Tests', () => {
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

  describe('XSS Prevention', () => {
    it('should sanitize user input in assignment title', () => {
      const xssPayload = '<script>alert("xss")</script>';

      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          title: xssPayload,
          description: faker.lorem.paragraph(),
          dueDate: faker.date.future(),
          maxScore: 100,
        },
      }).then(response => {
        cy.visit(`/assignments/${response.body.id}`);
        cy.get('h1').should('not.contain', '<script>');
      });
    });

    it('should sanitize user input in comments', () => {
      const xssPayload = '<img src="x" onerror="alert(1)">';

      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          title: 'Test Assignment',
          description: faker.lorem.paragraph(),
          dueDate: faker.date.future(),
          maxScore: 100,
        },
      }).then(response => {
        cy.request({
          method: 'POST',
          url: `/api/assignments/${response.body.id}/comments`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            content: xssPayload,
          },
        });
      });

      cy.visit('/assignments');
      cy.get('.comment-content').should('not.contain', '<img');
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing requests', () => {
      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': 'invalid-token',
        },
        body: {
          title: 'Test Assignment',
          description: faker.lorem.paragraph(),
          dueDate: faker.date.future(),
          maxScore: 100,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(403);
        expect(response.body.error).to.include('CSRF');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', () => {
      for (let i = 0; i < 5; i++) {
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: user.email,
            password: 'wrong-password',
          },
          failOnStatusCode: false,
        });
      }

      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: user.email,
          password: 'wrong-password',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(429);
        expect(response.body.error).to.include('rate limit');
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate file upload types', () => {
      const invalidFile = {
        name: 'test.exe',
        content: 'test content',
        type: 'application/x-msdownload',
        size: 1024,
      };

      cy.request({
        method: 'POST',
        url: '/api/files/upload',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          file: invalidFile,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body.error).to.include('invalid file type');
      });
    });

    it('should validate assignment dates', () => {
      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          title: 'Test Assignment',
          description: faker.lorem.paragraph(),
          dueDate: 'invalid-date',
          maxScore: 100,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body.error).to.include('invalid date');
      });
    });
  });

  describe('Authentication Security', () => {
    it('should not expose sensitive information in error messages', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'nonexistent@example.com',
          password: 'wrong-password',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(401);
        expect(response.body.error).to.not.include('password');
      });
    });

    it('should enforce password complexity', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: faker.internet.email(),
          password: 'weak',
          name: faker.person.fullName(),
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body.error).to.include('password complexity');
      });
    });
  });

  describe('Authorization', () => {
    it('should prevent unauthorized access to assignments', () => {
      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: 'invalid-token',
        },
        body: {
          title: 'Test Assignment',
          description: faker.lorem.paragraph(),
          dueDate: faker.date.future(),
          maxScore: 100,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(401);
      });
    });

    it("should prevent access to other users' data", () => {
      // Create another user
      const otherUser = {
        email: faker.internet.email(),
        password: 'TestPass123!',
        name: faker.person.fullName(),
      };

      cy.request('POST', '/api/auth/register', otherUser).then(response => {
        const otherUserId = response.body.id;

        // Try to access other user's profile
        cy.request({
          method: 'GET',
          url: `/api/users/${otherUserId}/profile`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          failOnStatusCode: false,
        }).then(response => {
          expect(response.status).to.equal(403);
        });
      });
    });
  });
});
