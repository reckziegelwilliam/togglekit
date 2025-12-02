/**
 * Test setup file
 */

import '@testing-library/jest-dom';

// Polyfill fetch for jsdom
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn() as any;
}

// Mock window.setInterval and clearInterval
if (typeof window !== 'undefined') {
  global.setInterval = window.setInterval;
  global.clearInterval = window.clearInterval;
}

