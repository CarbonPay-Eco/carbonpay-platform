import { jest } from '@jest/globals';

// Increase timeout for tests
jest.setTimeout(30000);

// Mock console methods in test environment
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup global test environment
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
});

afterAll(() => {
  // Cleanup any remaining handles
  jest.clearAllTimers();
}); 