const { chromium } = require('playwright');
const assert = require('assert');

async function runUAT() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting User Acceptance Testing...');

    // Test 1: User Registration
    console.log('Testing User Registration...');
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    assert(await page.url().includes('/dashboard'), 'Registration failed');

    // Test 2: Assignment Creation
    console.log('Testing Assignment Creation...');
    await page.click('text=Create Assignment');
    await page.fill('input[name="title"]', 'Test Assignment');
    await page.fill('textarea[name="description"]', 'Test Description');
    await page.fill('input[name="dueDate"]', '2024-12-31');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Test Assignment');
    assert(await page.isVisible('text=Test Assignment'), 'Assignment creation failed');

    // Test 3: File Upload
    console.log('Testing File Upload...');
    await page.click('text=Test Assignment');
    const fileInput = await page.$('input[type="file"]');
    await fileInput.setInputFiles('tests/test-file.txt');
    await page.click('button:has-text("Upload")');
    await page.waitForSelector('text=File uploaded successfully');
    assert(await page.isVisible('text=File uploaded successfully'), 'File upload failed');

    // Test 4: AI Analysis
    console.log('Testing AI Analysis...');
    await page.click('button:has-text("Analyze with AI")');
    await page.waitForSelector('text=Analysis complete');
    assert(await page.isVisible('text=Analysis complete'), 'AI analysis failed');

    // Test 5: Analytics View
    console.log('Testing Analytics View...');
    await page.click('text=Analytics');
    await page.waitForSelector('.performance-score');
    assert(await page.isVisible('.performance-score'), 'Analytics view failed');

    console.log('All UAT tests passed successfully!');
  } catch (error) {
    console.error('UAT Test Failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

runUAT().catch(console.error);
