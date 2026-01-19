import { test, expect } from '@playwright/test';
import { login } from '../utils';

test('create invoice with new customer and item', async ({ page }) => {
  // 1. Setup
  await page.goto('/');
  await login(page);

  // Time-based identifiers to ensure uniqueness
  const timestamp = Date.now();
  const customerName = `InvCust ${timestamp}`;
  const itemName = `InvItem ${timestamp}`;
  
  // 2. Create Customer
  await page.getByText('Customers', { exact: true }).click();
  await page.getByRole('button', { name: 'Add Customer' }).click();
  await page.getByLabel('Customer Name').fill(customerName);
  // Phone isn't strictly required but good for realism
  await page.getByLabel('Phone Number').fill('555-0199');
  await page.getByRole('button', { name: 'Add Customer' }).last().click();
  await expect(page.getByText('Add New Customer')).not.toBeVisible();

  // 3. Create Item
  await page.getByText('Items', { exact: true }).click();
  await page.getByRole('button', { name: 'Add Item' }).click();
  await page.getByLabel('Item Name').fill(itemName);
  
  // Set Price (Pricing Tab)
  await page.getByRole('button', { name: 'Pricing' }).click();
  await page.getByLabel('Sale Price').fill('100');
  
  // Submit Item
  await page.getByRole('button', { name: 'Add Item' }).last().click();
  await expect(page.getByText('Add New Item')).not.toBeVisible();

  // 4. Create Invoice
  // Navigate to Sale Invoices
  await page.getByText('Sale', { exact: true }).click();
  await page.getByText('Sale Invoices').click();
  
  // Open Modal
  await page.getByText('New Invoice').click();
  await expect(page.getByText('New Sale Invoice')).toBeVisible();

  // Select Customer
  // Triggers the dropdown
  await page.getByText('Select a customer...').click();
  // Select the specific option
  await page.getByRole('option', { name: customerName }).click();

  // Add Item
  // Check for 'Add First Item' (empty state)
  const addFirstItem = page.getByText('Add First Item');
  if (await addFirstItem.isVisible()) {
      await addFirstItem.click();
  } else {
      // Fallback if not empty
      await page.getByRole('button', { name: 'Add Item' }).click();
  }

  // Select Item in row
  await page.getByText('Select an item...').click();
  // Match loosely because label includes price (e.g., "Item Name - $100.00")
  await page.getByRole('option').filter({ hasText: itemName }).click();

  // Verify Total (Quantity default is 1, Price is 100)
  // We identify the Grand Total by its styling classes to distinguish from line items
  await expect(page.locator('.text-lg.font-bold.text-primary-600', { hasText: '$100.00' })).toBeVisible();
  
  // Submit
  await page.getByRole('button', { name: 'Create & Send' }).click();
  
  // Verify Modal Closes
  await expect(page.getByText('New Sale Invoice')).not.toBeVisible();
  
  // Verify Invoice in List
  // We search for the customer name to ensure it's listed
  await page.getByPlaceholder('Search invoices...').fill(customerName);
  await expect(page.getByText(customerName)).toBeVisible();
});
