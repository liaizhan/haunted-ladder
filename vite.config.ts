/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/haunted-ladder/',
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
    // Vitest replaces CSS with an empty string by default; tests read styles.css?raw.
    css: { include: [/.*/] },
  },
});
