import { Page } from '@playwright/test';

export async function login(page: Page) {
  // Wait for potential redirect
  try {
     await page.waitForURL('**/login', { timeout: 2000 });
  } catch (e) {
     // Already on dashboard or other page
  }

  const isLoginPage = page.url().includes('/login');
  if (isLoginPage) {
    const EMAIL = 'admin@example.com'; 
    const PASSWORD = 'Abc123.a';

    await page.getByLabel('Email address').fill(EMAIL);
    // Handle strict mode for password
    await page.getByPlaceholder('Enter your password').fill(PASSWORD);
    // Handle strict mode for sign in button
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    
    // Wait for navigation back to root
    await page.waitForURL('/', { timeout: 10000 });
    // Wait for UI to stabilize (Sidebar loaded)
    await page.getByText('Dashboard').first().waitFor();
  }
}
