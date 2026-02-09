# DigiStoq Desktop

A cross-platform desktop inventory management application built with Tauri, React, and PowerSync for offline-first data synchronization.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop Runtime**: Tauri 2.x (Rust)
- **Database**: SQLite (via PowerSync)
- **Backend**: Supabase (PostgreSQL, Auth)
- **Sync**: PowerSync (offline-first sync)

## Prerequisites

### All Platforms

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)

  ```bash
  # Install Rust via rustup
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

  # Windows: Download and run rustup-init.exe from https://rustup.rs

  # Verify installation
  rustc --version
  cargo --version
  ```

### Windows

1. **Visual Studio Build Tools 2022** with "Desktop development with C++" workload
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Run the installer and select:
     - "Desktop development with C++" workload
   - Or select these individual components:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 10/11 SDK

2. **WebView2 Runtime**
   - Usually pre-installed on Windows 10/11
   - If not, download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

3. **Rust** (via rustup)
   - Download `rustup-init.exe` from https://rustup.rs
   - Run the installer and follow the prompts
   - Restart your terminal after installation

### macOS

1. **Xcode Command Line Tools**

   ```bash
   xcode-select --install
   ```

2. **Rust** (via rustup)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Linux (Ubuntu/Debian)

1. **System dependencies**

   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
   ```

2. **Rust** (via rustup)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/DigiStoq/monorepo.git
   cd monorepo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISABLE_KEY=your_supabase_anon_key
   VITE_POWERSYNC_URL=your_powersync_url
   ```

4. **Run development server**
   ```bash
   npm run tauri:dev
   ```

## Available Scripts

| Command               | Description                           |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start Vite dev server (frontend only) |
| `npm run build`       | Build frontend for production         |
| `npm run tauri:dev`   | Start Tauri app in development mode   |
| `npm run tauri:build` | Build Tauri app for production        |
| `npm run lint`        | Run ESLint                            |
| `npm run lint:fix`    | Run ESLint with auto-fix              |
| `npm run format`      | Format code with Prettier             |
| `npm run typecheck`   | Run TypeScript type checking          |

## Project Structure

```
monorepo/
├── src/                    # Frontend source code
│   ├── app/               # App entry point
│   ├── components/        # Shared UI components
│   ├── features/          # Feature modules
│   │   └── inventory/     # Inventory management feature
│   └── lib/               # Utilities and configurations
│       ├── powersync.ts   # PowerSync database setup
│       └── supabase-connector.ts  # Supabase sync connector
├── src-tauri/             # Tauri (Rust) backend
│   ├── src/               # Rust source code
│   └── tauri.conf.json    # Tauri configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Troubleshooting

### Windows: "linker `link.exe` not found"

This error means Visual Studio Build Tools are not installed or not properly configured:

1. Install Visual Studio Build Tools 2022
2. Select "Desktop development with C++" workload
3. Restart your terminal after installation

### PowerSync/Supabase connection issues

- Verify your `.env` file has correct credentials
- Ensure the user is authenticated before PowerSync connects
- Check that your Supabase project has the required tables

## License

MIT
