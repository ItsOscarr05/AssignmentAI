import { faker } from '@faker-js/faker';

describe('Profile Management', () => {
  const user = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
  };

  before(() => {
    // Create test user
    cy.request('POST', '/api/auth/register', user);
  });

  beforeEach(() => {
    cy.login(user);
  });

  describe('Profile Updates', () => {
    it('should update profile information', () => {
      cy.visit('/settings/profile');

      // Update profile fields
      const newName = faker.person.fullName();
      const newBio = faker.lorem.paragraph();

      cy.findByLabelText(/name/i).clear().type(newName);
      cy.findByLabelText(/bio/i).clear().type(newBio);

      // Upload new avatar
      cy.findByLabelText(/avatar/i).attachFile({
        fileContent: 'test image content',
        fileName: 'avatar.png',
        mimeType: 'image/png',
      });

      // Save changes
      cy.findByRole('button', { name: /save changes/i }).click();

      // Verify changes
      cy.findByText(/profile updated/i).should('be.visible');
      cy.reload();
      cy.findByLabelText(/name/i).should('have.value', newName);
      cy.findByLabelText(/bio/i).should('have.value', newBio);
    });

    it('should handle validation errors', () => {
      cy.visit('/settings/profile');

      // Try empty name
      cy.findByLabelText(/name/i).clear();
      cy.findByRole('button', { name: /save changes/i }).click();
      cy.findByText(/name is required/i).should('be.visible');

      // Try invalid image file
      cy.findByLabelText(/avatar/i).attachFile({
        fileContent: 'test content',
        fileName: 'not-an-image.txt',
        mimeType: 'text/plain',
      });
      cy.findByText(/invalid file type/i).should('be.visible');
    });
  });

  describe('Password Changes', () => {
    it('should change password successfully', () => {
      cy.visit('/settings/security');

      const newPassword = 'NewPass123!';

      // Fill in password form
      cy.findByLabelText(/current password/i).type(user.password);
      cy.findByLabelText(/new password/i).type(newPassword);
      cy.findByLabelText(/confirm new password/i).type(newPassword);

      // Submit form
      cy.findByRole('button', { name: /change password/i }).click();

      // Verify success
      cy.findByText(/password updated/i).should('be.visible');

      // Try logging in with new password
      cy.findByRole('button', { name: /logout/i }).click();
      cy.login({ ...user, password: newPassword });
      cy.url().should('include', '/dashboard');
    });

    it('should handle password validation', () => {
      cy.visit('/settings/security');

      // Try wrong current password
      cy.findByLabelText(/current password/i).type('WrongPass123!');
      cy.findByLabelText(/new password/i).type('NewPass123!');
      cy.findByLabelText(/confirm new password/i).type('NewPass123!');
      cy.findByRole('button', { name: /change password/i }).click();
      cy.findByText(/current password is incorrect/i).should('be.visible');

      // Try weak new password
      cy.findByLabelText(/current password/i)
        .clear()
        .type(user.password);
      cy.findByLabelText(/new password/i)
        .clear()
        .type('weak');
      cy.findByRole('button', { name: /change password/i }).click();
      cy.findByText(/password must be at least/i).should('be.visible');

      // Try mismatched passwords
      cy.findByLabelText(/new password/i)
        .clear()
        .type('StrongPass123!');
      cy.findByLabelText(/confirm new password/i)
        .clear()
        .type('DifferentPass123!');
      cy.findByRole('button', { name: /change password/i }).click();
      cy.findByText(/passwords do not match/i).should('be.visible');
    });
  });

  describe('2FA Management', () => {
    it('should enable 2FA', () => {
      cy.visit('/settings/security');

      // Start 2FA setup
      cy.findByRole('button', { name: /enable 2fa/i }).click();

      // Verify QR code is displayed
      cy.findByAltText(/qr code/i).should('be.visible');
      cy.findByText(/scan this qr code/i).should('be.visible');

      // Enter verification code
      cy.findByLabelText(/verification code/i).type('123456');
      cy.findByRole('button', { name: /verify/i }).click();

      // Verify 2FA is enabled
      cy.findByText(/2fa enabled/i).should('be.visible');
      cy.findByText(/backup codes/i).should('be.visible');

      // Save backup codes
      cy.findByRole('button', { name: /download backup codes/i }).click();
    });

    it('should disable 2FA', () => {
      cy.visit('/settings/security');

      // Disable 2FA
      cy.findByRole('button', { name: /disable 2fa/i }).click();
      cy.findByLabelText(/verification code/i).type('123456');
      cy.findByRole('button', { name: /confirm/i }).click();

      // Verify 2FA is disabled
      cy.findByText(/2fa disabled/i).should('be.visible');
      cy.findByRole('button', { name: /enable 2fa/i }).should('be.visible');
    });

    it('should handle invalid 2FA codes', () => {
      cy.visit('/settings/security');

      // Try enabling 2FA with invalid code
      cy.findByRole('button', { name: /enable 2fa/i }).click();
      cy.findByLabelText(/verification code/i).type('000000');
      cy.findByRole('button', { name: /verify/i }).click();
      cy.findByText(/invalid code/i).should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should list and manage sessions', () => {
      cy.visit('/settings/sessions');

      // Verify current session is listed
      cy.findByText(/current session/i).should('be.visible');
      cy.findByText(new RegExp(Cypress.browser.name, 'i')).should('be.visible');

      // Create another session
      cy.clearCookies();
      cy.login(user);

      // Verify multiple sessions
      cy.visit('/settings/sessions');
      cy.findByText(/active sessions/i).should('be.visible');

      // Revoke other sessions
      cy.findByRole('button', { name: /revoke all other sessions/i }).click();
      cy.findByRole('button', { name: /confirm/i }).click();

      // Verify sessions were revoked
      cy.findByText(/sessions revoked/i).should('be.visible');
      cy.reload();
      cy.findAllByText(/active session/i).should('have.length', 1);
    });
  });

  describe('Account Deletion', () => {
    it('should handle account deletion', () => {
      cy.visit('/settings/account');

      // Start deletion process
      cy.findByRole('button', { name: /delete account/i }).click();

      // Confirm deletion
      cy.findByLabelText(/confirm password/i).type(user.password);
      cy.findByRole('button', { name: /confirm deletion/i }).click();

      // Verify account is deleted
      cy.findByText(/account deleted/i).should('be.visible');
      cy.url().should('include', '/login');

      // Try logging in
      cy.visit('/login');
      cy.findByLabelText(/email/i).type(user.email);
      cy.findByLabelText(/password/i).type(user.password);
      cy.findByRole('button', { name: /login/i }).click();
      cy.findByText(/account not found/i).should('be.visible');
    });

    it('should require password confirmation for deletion', () => {
      cy.visit('/settings/account');

      // Try deletion with wrong password
      cy.findByRole('button', { name: /delete account/i }).click();
      cy.findByLabelText(/confirm password/i).type('WrongPass123!');
      cy.findByRole('button', { name: /confirm deletion/i }).click();
      cy.findByText(/incorrect password/i).should('be.visible');
    });
  });
});
