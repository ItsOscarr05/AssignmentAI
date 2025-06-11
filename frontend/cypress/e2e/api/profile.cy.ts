import { faker } from '@faker-js/faker';

describe('User Profile API', () => {
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

  describe('Profile Information', () => {
    it('should get user profile', () => {
      cy.request({
        method: 'GET',
        url: '/api/profile',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('id');
        expect(response.body.email).to.equal(user.email);
        expect(response.body.name).to.equal(user.name);
      });
    });

    it('should update user profile', () => {
      const updates = {
        name: faker.person.fullName(),
        bio: faker.lorem.paragraph(),
      };

      cy.request({
        method: 'PUT',
        url: '/api/profile',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: updates,
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body.name).to.equal(updates.name);
        expect(response.body.bio).to.equal(updates.bio);
      });
    });

    it('should validate profile updates', () => {
      const invalidUpdates = {
        name: '',
        email: 'invalid-email',
      };

      cy.request({
        method: 'PUT',
        url: '/api/profile',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: invalidUpdates,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('errors');
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Password Management', () => {
    it('should change password', () => {
      const newPassword = 'NewPass123!';
      const passwordChange = {
        currentPassword: user.password,
        newPassword,
      };

      cy.request({
        method: 'PUT',
        url: '/api/profile/password',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: passwordChange,
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('password updated');

        // Update auth token with new password
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: user.email,
            password: newPassword,
          },
        }).then(loginResponse => {
          authToken = loginResponse.body.token;
        });
      });
    });

    it('should validate password change', () => {
      const invalidChange = {
        currentPassword: 'WrongPass123!',
        newPassword: 'weak',
      };

      cy.request({
        method: 'PUT',
        url: '/api/profile/password',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: invalidChange,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('current password is incorrect');
      });
    });
  });

  describe('Avatar Management', () => {
    it('should upload avatar', () => {
      const avatar = {
        file: {
          name: 'avatar.png',
          content: 'test image content',
          type: 'image/png',
        },
      };

      cy.request({
        method: 'POST',
        url: '/api/profile/avatar',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: avatar,
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('avatarUrl');
        expect(response.body.avatarUrl).to.include('avatar.png');
      });
    });

    it('should validate avatar upload', () => {
      const invalidAvatar = {
        file: {
          name: 'test.txt',
          content: 'not an image',
          type: 'text/plain',
        },
      };

      cy.request({
        method: 'POST',
        url: '/api/profile/avatar',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: invalidAvatar,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('invalid file type');
      });
    });

    it('should delete avatar', () => {
      cy.request({
        method: 'DELETE',
        url: '/api/profile/avatar',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('avatar deleted');

        // Verify avatar is removed
        cy.request({
          method: 'GET',
          url: '/api/profile',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then(profileResponse => {
          expect(profileResponse.body.avatarUrl).to.be.null;
        });
      });
    });
  });

  describe('Account Deletion', () => {
    it('should delete user account', () => {
      cy.request({
        method: 'DELETE',
        url: '/api/profile',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          password: user.password,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('account deleted');

        // Verify account is deleted
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: user.email,
            password: user.password,
          },
          failOnStatusCode: false,
        }).then(loginResponse => {
          expect(loginResponse.status).to.equal(401);
          expect(loginResponse.body).to.have.property('error');
          expect(loginResponse.body.error).to.include('invalid credentials');
        });
      });
    });

    it('should require password confirmation for deletion', () => {
      cy.request({
        method: 'DELETE',
        url: '/api/profile',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          password: 'WrongPass123!',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('incorrect password');
      });
    });
  });
});
