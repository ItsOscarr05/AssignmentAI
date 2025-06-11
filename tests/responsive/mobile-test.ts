import { expect, test } from '@playwright/test';

const devices = [
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
  { name: 'Pixel 5', width: 393, height: 851 },
  { name: 'Samsung Galaxy S20', width: 360, height: 800 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
];

test.describe('Mobile Responsiveness Tests', () => {
  devices.forEach(device => {
    test(`should render correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('http://localhost:3000');

      // Test navigation menu
      if (device.width < 768) {
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="desktop-menu"]')).not.toBeVisible();
      } else {
        await expect(page.locator('[data-testid="desktop-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
      }

      // Test form layouts
      await page.click('[data-testid="create-assignment-button"]');
      const form = page.locator('[data-testid="assignment-form"]');
      await expect(form).toBeVisible();

      // Test input fields
      const inputs = page.locator('input, textarea');
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(device.width);
      }

      // Test buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(device.width);
      }

      // Test text readability
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6');
      const textCount = await textElements.count();
      for (let i = 0; i < textCount; i++) {
        const text = textElements.nth(i);
        const box = await text.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(device.width);
      }

      // Test images
      const images = page.locator('img');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const box = await image.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(device.width);
      }
    });
  });

  test('should handle orientation changes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12
    await page.goto('http://localhost:3000');

    // Test portrait mode
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test landscape mode
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Verify content is still accessible
    await page.click('[data-testid="create-assignment-button"]');
    await expect(page.locator('[data-testid="assignment-form"]')).toBeVisible();
  });
});
