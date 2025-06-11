import { faker } from '@faker-js/faker';

describe('Authentication API', () => {
  const user = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
  };

  describe('Registration', () => {
    it('should register a new user successfully', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: user,
      }).then(response => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('user');
        expect(response.body.user).to.have.property('id');
        expect(response.body.user.email).to.equal(user.email);
        expect(response.body.user.name).to.equal(user.name);
        expect(response.body.user).to.not.have.property('password');
      });
    });

    it('should handle duplicate email registration', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: user,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('email already exists');
      });
    });

    it('should validate registration input', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'weak',
        name: '',
      };

      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: invalidUser,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('errors');
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors).to.have.length.greaterThan(0);
        expect(response.body.errors[0]).to.have.property('field');
        expect(response.body.errors[0]).to.have.property('message');
      });
    });
  });

  describe('Login', () => {
    it('should login successfully', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: user.email,
          password: user.password,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('token');
        expect(response.body).to.have.property('user');
        expect(response.body.user.email).to.equal(user.email);
        expect(response.body.user).to.not.have.property('password');
      });
    });

    it('should handle invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: user.email,
          password: 'WrongPass123!',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(401);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('invalid credentials');
      });
    });

    it('should handle non-existent user', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(401);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('invalid credentials');
      });
    });
  });

  describe('2FA', () => {
    let authToken: string;

    beforeEach(() => {
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

    it('should generate 2FA secret', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/2fa/generate',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('secret');
        expect(response.body).to.have.property('qrCode');
      });
    });

    it('should verify 2FA code', () => {
      // First generate 2FA secret
      cy.request({
        method: 'POST',
        url: '/api/auth/2fa/generate',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        const secret = response.body.secret;
        const code = '123456'; // This would be generated from the secret in a real app

        // Verify the code
        cy.request({
          method: 'POST',
          url: '/api/auth/2fa/verify',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            code,
            secret,
          },
        }).then(verifyResponse => {
          expect(verifyResponse.status).to.equal(200);
          expect(verifyResponse.body).to.have.property('success', true);
        });
      });
    });

    it('should handle invalid 2FA code', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/2fa/verify',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          code: '000000',
          secret: 'invalid-secret',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('invalid code');
      });
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/password-reset/request',
        body: {
          email: user.email,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('reset email sent');
      });
    });

    it('should handle non-existent email for reset', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/password-reset/request',
        body: {
          email: 'nonexistent@example.com',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(404);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('user not found');
      });
    });

    it('should reset password with valid token', () => {
      const newPassword = 'NewPass123!';
      const resetToken = 'valid-reset-token'; // This would come from the reset email

      cy.request({
        method: 'POST',
        url: '/api/auth/password-reset/reset',
        body: {
          token: resetToken,
          password: newPassword,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('password reset successful');

        // Verify can login with new password
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: user.email,
            password: newPassword,
          },
        }).then(loginResponse => {
          expect(loginResponse.status).to.equal(200);
          expect(loginResponse.body).to.have.property('token');
        });
      });
    });

    it('should handle invalid reset token', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/password-reset/reset',
        body: {
          token: 'invalid-token',
          password: 'NewPass123!',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('invalid token');
      });
    });
  });

  describe('Session Management', () => {
    let authToken: string;

    beforeEach(() => {
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

    it('should get active sessions', () => {
      cy.request({
        method: 'GET',
        url: '/api/auth/sessions',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body[0]).to.have.property('id');
        expect(response.body[0]).to.have.property('deviceName');
        expect(response.body[0]).to.have.property('lastActive');
      });
    });

    it('should revoke session', () => {
      // First get sessions
      cy.request({
        method: 'GET',
        url: '/api/auth/sessions',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        const sessionId = response.body[0].id;

        // Revoke the session
        cy.request({
          method: 'DELETE',
          url: `/api/auth/sessions/${sessionId}`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then(revokeResponse => {
          expect(revokeResponse.status).to.equal(200);
          expect(revokeResponse.body).to.have.property('message');
          expect(revokeResponse.body.message).to.include('session revoked');

          // Verify session is removed
          cy.request({
            method: 'GET',
            url: '/api/auth/sessions',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }).then(verifyResponse => {
            expect(verifyResponse.body).to.not.include(sessionId);
          });
        });
      });
    });

    it('should revoke all other sessions', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/sessions/revoke-all',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('sessions revoked');

        // Verify only current session remains
        cy.request({
          method: 'GET',
          url: '/api/auth/sessions',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then(verifyResponse => {
          expect(verifyResponse.body).to.have.length(1);
        });
      });
    });
  });
});
