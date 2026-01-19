import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'src-tauri'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Adding this to help with ESM issues if they persist
    deps: {
      inline: [/^(?!.*node_modules).*/],
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
