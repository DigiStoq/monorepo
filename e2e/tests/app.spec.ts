import { test, expect } from '@playwright/test';
import { login } from '../utils';

test('has title and can navigate to dashboard', async ({ page }) => {
  await page.goto('/');
  await login(page);

  // Expect a title "to contain" specific text.
  await expect(page).toHaveTitle(/DigiStoq|Dashboard/);

  // Verify Dashboard
  await expect(page.getByText("Today's Sales")).toBeVisible();
});

test('can navigate to sale invoices page', async ({ page }) => {
  await page.goto('/');
  await login(page);
  
  // Click 'Sale' to expand the section (it has children)
  await page.getByText('Sale', { exact: true }).click();
  // Click 'Sale Invoices'
  await page.getByText('Sale Invoices').click();

  await expect(page.getByRole('heading', { name: 'Sale Invoices' })).toBeVisible();
  
  // Open New Invoice Modal
  await page.getByText('New Invoice').click();
  await expect(page.getByText('New Sale Invoice')).toBeVisible();
});
