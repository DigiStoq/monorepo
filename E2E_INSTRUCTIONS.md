# End-to-End (E2E) Testing Instructions

This repository contains E2E test scripts for both Mobile (Maestro) and Desktop (Playwright). Since these tests require a running simulator or browser environment, you must execute them on your local machine.

## 📱 Mobile App (Maestro)

We use **Maestro** for mobile UI testing. It allows for simple, declarative test flows.

### 1. Prerequisites

- **Maestro CLI**: Install via [maestro.mobile.dev](https://maestro.mobile.dev/).
  ```bash
  curl -Ls "https://get.maestro.mobile.dev" | bash
  ```
- **Android Emulator / iOS Simulator**: Must be running.
- **App Built/Running**: You should have the app running on the emulator.

### 2. Running the Test

Navigate to the mobile directory and run the flow:

```bash
cd mobile
maestro test .maestro/flow.yaml
```

This will automatically:

1. Launch the app `com.anonymous.mobile`.
2. Perform login actions.
3. Create a sample invoice.
4. Verify the UI updates.

---

## 🖥️ Desktop App (Playwright)

We use **Playwright** to test the web-based frontend of the Desktop (Tauri) application.

### 1. Prerequisites

Install Playwright dependencies (if not already installed):

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Running the Test

This will start the Vite dev server and run the tests in a headless browser.

```bash
# In the root directory
npx playwright test
```

To see the tests running visually (not headless):

```bash
npx playwright test --ui
```

### 3. Files

- **Configuration**: `e2e/playwright.config.ts`
- **Tests**: `e2e/tests/app.spec.ts`
