import { test, expect } from '@playwright/test';
import { login } from '../utils';

test('create new customer', async ({ page }) => {
  await page.goto('/');
  await login(page);

  // Navigate to Customers
  await page.getByText('Customers', { exact: true }).click();
  
  // Verify Page Header
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

  // Open Creation Modal
  await page.getByRole('button', { name: 'Add Customer' }).click();
  await expect(page.getByText('Add New Customer')).toBeVisible();

  // Fill Form
  const timestamp = Date.now();
  const customerName = `Test Customer ${timestamp}`;
  
  await page.getByLabel('Customer Name').fill(customerName);
  await page.getByLabel('Phone Number').fill('555-0100');

  // Submit
  // Note: Submit button is also 'Add Customer'
  await page.getByRole('button', { name: 'Add Customer' }).last().click();

  // Verify modal closed (or wait for it)
  await expect(page.getByText('Add New Customer')).not.toBeVisible();

  // Verify in list
  // The list might be virtualized or filtered, but for a new item it usually appears at top or we search
  // Let's Search for it to be sure
  await page.getByPlaceholder('Search customers...').fill(customerName);
  await expect(page.getByText(customerName)).toBeVisible();
});
