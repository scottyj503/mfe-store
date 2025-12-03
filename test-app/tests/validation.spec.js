import { test, expect } from '@playwright/test';

test.describe('Schema Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/validation.html');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    });
    await page.reload();
  });

  test('accepts valid string value', async ({ page }) => {
    await page.goto('/validation.html');

    await page.getByTestId('username-input').fill('Alice');
    await page.getByTestId('set-username-btn').click();

    await expect(page.getByTestId('result')).toContainText('Set username: "Alice"');
    await expect(page.getByTestId('error')).toHaveText('--');
  });

  test('rejects invalid type (number instead of string)', async ({ page }) => {
    await page.goto('/validation.html');

    await page.getByTestId('set-username-invalid-btn').click();

    await expect(page.getByTestId('error')).toContainText('username must be a string');
    await expect(page.getByTestId('result')).toHaveText('--');
  });

  test('rejects string that is too short', async ({ page }) => {
    await page.goto('/validation.html');

    await page.getByTestId('username-input').fill('A');
    await page.getByTestId('set-username-btn').click();

    await expect(page.getByTestId('error')).toContainText('at least 2 characters');
  });

  test('accepts valid number value', async ({ page }) => {
    await page.goto('/validation.html');

    await page.getByTestId('age-input').fill('25');
    await page.getByTestId('set-age-btn').click();

    await expect(page.getByTestId('result')).toContainText('Set age: 25');
    await expect(page.getByTestId('error')).toHaveText('--');
  });

  test('rejects invalid type (string instead of number)', async ({ page }) => {
    await page.goto('/validation.html');

    await page.getByTestId('set-age-invalid-btn').click();

    await expect(page.getByTestId('error')).toContainText('age must be a number');
  });
});
