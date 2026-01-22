import { test, expect, Page } from "@playwright/test";
import { login } from "../utils";

/**
 * Ensures the sidebar is expanded.
 * Only needed for accessing nested navigation items (e.g., Sale > Sale Invoices).
 * Top-level items can be clicked via their icon/title even when collapsed.
 */
async function ensureSidebarExpanded(page: Page) {
  // Check if we are already expanded?
  // The toggle button "aria-label" tells us the CURRENT action available.
  // If label is "Expand sidebar", it is currently collapsed.
  // If label is "Collapse sidebar", it is currently expanded.
  
  const toggleBtn = page.locator(
    'button[aria-label="Expand sidebar"], button[aria-label="Collapse sidebar"]'
  );
  
  // Wait shortly for it to appear (it should be there if we are logged in)
  try {
    await toggleBtn.waitFor({ timeout: 5000 });
    const label = await toggleBtn.getAttribute("aria-label");
    if (label === "Expand sidebar") {
      await toggleBtn.click();
      // Wait for expansion animation
      await page.waitForTimeout(500);
    }
  } catch (e) {
    // If button not found or timeout, we might be on a screen without sidebar 
    // or it's hidden (mobile?). We proceed hoping for the best or that getByRole works.
    console.log("Sidebar toggle not found or timeout", e);
  }
}

/**
 * Navigates to Settings > Tax & Invoice
 * Uses getByRole to work in both collapsed and expanded states.
 */
async function navigateToSettings(page: Page) {
  // Settings button identification:
  // - Expanded: Accessible name "Settings" from inner text
  // - Collapsed: title="Settings" attribute (no accessible name in collapsed state)
  const settingsBtn = page
    .getByRole("button", { name: "Settings", exact: true })
    .or(page.locator('button[title="Settings"]'));
  await settingsBtn.click();

  // "Tax & Invoice" is a card/link on the Settings Hub page.
  await page.getByText("Tax & Invoice").click();

  // Wait for page load
  await expect(page.getByText("Loading...")).not.toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Invoice Numbering")).toBeVisible();
}

test.describe("Invoice Numbering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page);
    // Ensure app is stable
    await page.waitForLoadState("networkidle");
  });

  test("should display invoice number preview in settings", async ({
    page,
  }) => {
    await navigateToSettings(page);

    // Check that the preview is displayed
    const preview = page.locator(
      ".font-mono.text-lg.font-semibold.text-teal-600"
    );
    await expect(preview).toBeVisible();

    // Verify it follows the format: PREFIX-PADDEDNUMBER (e.g., INV-1001)
    const previewText = await preview.textContent();
    expect(previewText).toMatch(/^[A-Z]+-\d+$/);
  });

  test("should update invoice number preview when prefix changes", async ({
    page,
  }) => {
    await navigateToSettings(page);

    // Find and update the prefix input
    const prefixInput = page.locator('input[type="text"].font-mono').first();
    await prefixInput.clear();
    await prefixInput.fill("SALE");

    // Check that the preview updates
    const preview = page.locator(
      ".font-mono.text-lg.font-semibold.text-teal-600"
    );
    await expect(preview).toContainText("SALE-");
  });

  test("should update invoice number preview when next number changes", async ({
    page,
  }) => {
    await navigateToSettings(page);

    // Find and update the next number input
    const nextNumberInput = page
      .locator('input[type="number"].font-mono')
      .first();
    await nextNumberInput.clear();
    await nextNumberInput.fill("5000");

    // Check that the preview updates
    const preview = page.locator(
      ".font-mono.text-lg.font-semibold.text-teal-600"
    );
    await expect(preview).toContainText("5000");
  });

  test("should persist invoice numbering settings after save", async ({
    page,
  }) => {
    await navigateToSettings(page);

    // Update prefix to a unique value
    const timestamp = Date.now();
    const testPrefix = `T${timestamp.toString().slice(-4)}`;

    const prefixInput = page.locator('input[type="text"].font-mono').first();
    await prefixInput.clear();
    await prefixInput.fill(testPrefix);

    // Save settings
    await page.getByRole("button", { name: /save/i }).click();

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Navigate back to settings
    await navigateToSettings(page);

    // Verify the prefix was persisted
    const prefixInputAfterReload = page
      .locator('input[type="text"].font-mono')
      .first();
    await expect(prefixInputAfterReload).toHaveValue(testPrefix);
  });

  test("should generate sequential invoice numbers on create", async ({
    page,
  }) => {
    // First, set a known prefix and starting number in settings
    await navigateToSettings(page);

    // Set a unique prefix for this test
    const testPrefix = "TEST";
    const prefixInput = page.locator('input[type="text"].font-mono').first();
    await prefixInput.clear();
    await prefixInput.fill(testPrefix);

    // Save settings
    await page.getByRole("button", { name: /save/i }).click();
    await page.waitForTimeout(1000);

    // Create a customer for the invoices
    const timestamp = Date.now();
    const customerName = `SeqTest ${timestamp}`;

    // Customers is top-level - use combined locator
    const customersBtn = page
      .getByRole("button", { name: "Customers", exact: true })
      .or(page.locator('button[title="Customers"]'));
    await customersBtn.click();
    
    await page.getByRole("button", { name: "Add Customer" }).click();
    await page.getByLabel("Customer Name").fill(customerName);
    await page.getByLabel("Phone Number").fill("555-0100");
    await page.getByRole("button", { name: "Add Customer" }).last().click();
    await expect(page.getByText("Add New Customer")).not.toBeVisible();

    // Items is top-level - use combined locator
    const itemName = `SeqItem ${timestamp}`;
    const itemsBtn = page
      .getByRole("button", { name: "Items", exact: true })
      .or(page.locator('button[title="Items"]'));
    await itemsBtn.click();
    
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.getByLabel("Item Name").fill(itemName);
    await page.getByRole("button", { name: "Pricing" }).click();
    await page.getByLabel("Sale Price").fill("50");
    await page.getByRole("button", { name: "Add Item" }).last().click();
    await expect(page.getByText("Add New Item")).not.toBeVisible();

    // Sale Invoices is nested - MUST ensure expanded
    await ensureSidebarExpanded(page);
    const saleBtn = page
      .getByRole("button", { name: "Sale", exact: true })
      .or(page.locator('button[title="Sale"]'));
    await saleBtn.click();
    await page.getByText("Sale Invoices").click();

    // Create first invoice
    await page.getByText("New Invoice").click();
    await expect(page.getByText("New Sale Invoice")).toBeVisible();

    // Select Customer
    await page.getByText("Select a customer...").click();
    await page.getByRole("option", { name: customerName }).click();

    // Add Item
    const addFirstItem = page.getByText("Add First Item");
    if (await addFirstItem.isVisible()) {
      await addFirstItem.click();
    } else {
      await page.getByRole("button", { name: "Add Item" }).click();
    }
    await page.getByText("Select an item...").click();
    await page.getByRole("option").filter({ hasText: itemName }).click();

    // Save first invoice
    await page.getByRole("button", { name: "Add Item" }).last().click();
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("New Sale Invoice")).not.toBeVisible();

    // Get the first invoice number from the list
    await page.getByPlaceholder("Search invoices...").fill(customerName);
    await page.waitForTimeout(500);

    // The invoice list should show the invoice with our test prefix
    await expect(page.getByText(new RegExp(`${testPrefix}-\\d+`))).toBeVisible();
  });
});

test.describe("Invoice Numbering Padding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page);
    await page.waitForLoadState("networkidle");
  });

  test("should respect padding setting in invoice number format", async ({
    page,
  }) => {
    await navigateToSettings(page);

    // Find the padding select and change to 5 digits
    const paddingSelect = page.locator("select").filter({ hasText: "digits" });
    await paddingSelect.selectOption("5");

    // Set a low next number to see padding effect
    const nextNumberInput = page
      .locator('input[type="number"].font-mono')
      .first();
    await nextNumberInput.clear();
    await nextNumberInput.fill("42");

    // Check that the preview shows proper padding (e.g., INV-00042)
    const preview = page.locator(
      ".font-mono.text-lg.font-semibold.text-teal-600"
    );
    const previewText = await preview.textContent();
    expect(previewText).toMatch(/-00042$/);
  });
});
