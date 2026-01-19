import { test, expect } from '@playwright/test';
import { login } from '../utils';

test('login fails with invalid credentials', async ({ page }) => {
  await page.goto('/login');
  
  // Ensure we are on login (in case of auto-redirect, though login() usually handles this for authenticated flows)
  // Here we want to be unauthenticated.
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

  await page.getByLabel('Email address').fill('wrong@example.com');
  await page.getByPlaceholder('Enter your password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  
  await expect(page.getByText('Invalid login credentials')).toBeVisible();
});

test('customer form shows validation errors', async ({ page }) => {
  await page.goto('/');
  await login(page);
  
  await page.getByText('Customers', { exact: true }).click();
  await page.getByRole('button', { name: 'Add Customer' }).click();
  
  // Submit without filling name
  await page.getByRole('button', { name: 'Add Customer' }).last().click();
  
  // Expect validation message
  await expect(page.getByText('Customer name is required')).toBeVisible();
});

test('item form shows validation errors', async ({ page }) => {
  await page.goto('/');
  await login(page);
  
  await page.getByText('Items', { exact: true }).click();
  await page.getByRole('button', { name: 'Add Item' }).click();
  
  // Submit without filling name
  await page.getByRole('button', { name: 'Add Item' }).last().click();
  
  // Expect validation message
  await expect(page.getByText('Item name is required')).toBeVisible();
});
