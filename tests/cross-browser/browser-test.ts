import { expect, test } from '@playwright/test';

test.describe('Cross Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('login form works in all browsers', async ({ page }) => {
    // Test login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Check for successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('assignment creation works in all browsers', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Navigate to create assignment
    await page.click('[data-testid="create-assignment-button"]');

    // Fill assignment form
    await page.fill('[data-testid="title-input"]', 'Test Assignment');
    await page.fill('[data-testid="description-input"]', 'Test Description');
    await page.fill('[data-testid="due-date-input"]', '2024-12-31');
    await page.click('[data-testid="submit-button"]');

    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('responsive design works in all browsers', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="tablet-menu"]')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-menu"]')).toBeVisible();
  });

  test('form validation works in all browsers', async ({ page }) => {
    // Test login form validation
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    // Test assignment form validation
    await page.click('[data-testid="create-assignment-button"]');
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
  });
});
