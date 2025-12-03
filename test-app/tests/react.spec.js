import { test, expect } from '@playwright/test';

test.describe('React Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/react.html');
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

  test('useValue hook loads and displays initial state', async ({ page }) => {
    await page.goto('/react.html');

    // Wait for loading to complete
    await expect(page.getByTestId('count-value')).toBeVisible();
    await expect(page.getByTestId('count-value')).toHaveText('0');
  });

  test('increment and decrement work with useValue', async ({ page }) => {
    await page.goto('/react.html');

    // Wait for initial load
    await expect(page.getByTestId('count-value')).toHaveText('0');

    // Increment
    await page.getByTestId('increment-btn').click();
    await expect(page.getByTestId('count-value')).toHaveText('1');

    await page.getByTestId('increment-btn').click();
    await expect(page.getByTestId('count-value')).toHaveText('2');

    // Decrement
    await page.getByTestId('decrement-btn').click();
    await expect(page.getByTestId('count-value')).toHaveText('1');
  });

  test('validation works with React hooks', async ({ page }) => {
    await page.goto('/react.html');

    // Set invalid value
    await page.getByTestId('set-invalid-btn').click();

    // Should show error
    await expect(page.getByTestId('error')).toContainText('count must be a number');
  });

  test('user profile updates work', async ({ page }) => {
    await page.goto('/react.html');

    // Initial state
    await expect(page.getByTestId('user-value')).toHaveText('--');

    // Set user
    await page.getByTestId('user-input').fill('Alice');
    await page.getByTestId('set-user-btn').click();

    await expect(page.getByTestId('user-value')).toContainText('Alice');

    // Clear user
    await page.getByTestId('clear-user-btn').click();
    await expect(page.getByTestId('user-value')).toHaveText('--');
  });

  test('state persists after reload', async ({ page }) => {
    await page.goto('/react.html');

    // Set count
    await page.getByTestId('increment-btn').click();
    await page.getByTestId('increment-btn').click();
    await expect(page.getByTestId('count-value')).toHaveText('2');

    // Reload
    await page.reload();

    // Should persist
    await expect(page.getByTestId('count-value')).toHaveText('2');
  });
});
