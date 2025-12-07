import { test, expect } from '@playwright/test';

test.describe('mfe-store pub/sub', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
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

  test('Site B receives updates when Site A publishes', async ({ page }) => {
    await page.goto('/');

    // Verify initial state
    await expect(page.getByTestId('site-a-value')).toHaveText('--');
    await expect(page.getByTestId('site-b-value')).toHaveText('--');
    await expect(page.getByTestId('update-count')).toHaveText('0');

    // Site A publishes a user
    await page.getByTestId('user-input').fill('Alice');
    await page.getByTestId('set-user-btn').click();

    // Site B should receive the update
    await expect(page.getByTestId('site-b-value')).toContainText('Alice');
    await expect(page.getByTestId('update-count')).toHaveText('1');

    // Site A should also show the value
    await expect(page.getByTestId('site-a-value')).toContainText('Alice');
  });

  test('Site B receives multiple updates', async ({ page }) => {
    await page.goto('/');

    // First update
    await page.getByTestId('user-input').fill('Alice');
    await page.getByTestId('set-user-btn').click();
    await expect(page.getByTestId('update-count')).toHaveText('1');

    // Second update
    await page.getByTestId('user-input').fill('Bob');
    await page.getByTestId('set-user-btn').click();
    await expect(page.getByTestId('update-count')).toHaveText('2');
    await expect(page.getByTestId('site-b-value')).toContainText('Bob');

    // Third update
    await page.getByTestId('user-input').fill('Charlie');
    await page.getByTestId('set-user-btn').click();
    await expect(page.getByTestId('update-count')).toHaveText('3');
    await expect(page.getByTestId('site-b-value')).toContainText('Charlie');
  });

  test('Clear removes data and notifies subscriber', async ({ page }) => {
    await page.goto('/');

    // Set a value
    await page.getByTestId('user-input').fill('Alice');
    await page.getByTestId('set-user-btn').click();
    await expect(page.getByTestId('site-b-value')).toContainText('Alice');

    // Clear
    await page.getByTestId('clear-btn').click();

    // Both sites should show empty state
    await expect(page.getByTestId('site-a-value')).toHaveText('--');
    await expect(page.getByTestId('site-b-value')).toHaveText('--');
  });

  test('Data persists after page reload', async ({ page }) => {
    await page.goto('/');

    // Set a value
    await page.getByTestId('user-input').fill('Alice');
    await page.getByTestId('set-user-btn').click();
    await expect(page.getByTestId('site-b-value')).toContainText('Alice');

    // Reload page
    await page.reload();

    // Data should persist from IndexedDB
    await expect(page.getByTestId('site-a-value')).toContainText('Alice');
    await expect(page.getByTestId('site-b-value')).toContainText('Alice');
  });
});
