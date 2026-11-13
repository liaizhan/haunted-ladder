/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/haunted-ladder/',
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
  },
});
