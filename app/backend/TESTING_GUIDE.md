# CarbonPay Backend Testing Guide

## 🎯 Overview

This document outlines the comprehensive testing structure we've implemented for the CarbonPay backend. Our testing strategy covers unit tests, integration tests, and utilities to ensure reliability and maintainability.

## 📁 Test Structure

```
src/
├── __tests__/
│   ├── services/              # Service layer tests
│   │   ├── auth.service.test.ts
│   │   └── wallet.service.test.ts
│   ├── controllers/           # Controller/API tests  
│   │   └── auth.controller.test.ts
│   ├── middleware/            # Middleware tests
│   │   └── auth.middleware.test.ts
│   ├── utils/                 # Utility function tests
│   │   └── asyncHandler.test.ts
│   └── integration/           # Integration tests
│       └── auth-wallet-flow.test.ts
├── test-utils/                # Test utilities
│   ├── database.ts           # Test database setup
│   ├── mocks.ts              # Mock utilities
│   ├── setup.ts              # Jest setup
│   └── test-runner.ts        # Custom test runner
└── __mocks__/                 # Global mocks
```

## 🔧 Test Categories

### 1. **Unit Tests**
- **Services**: Test business logic in isolation
- **Controllers**: Test API endpoints and request handling
- **Middleware**: Test authentication and authorization
- **Utils**: Test utility functions

### 2. **Integration Tests**
- End-to-end workflow testing
- Database integration
- Service interaction testing

### 3. **Mock Strategy**
- External dependencies (Solana, crypto libraries)
- Database isolation with in-memory SQLite
- JWT and authentication mocking

## 🛠️ Test Utilities

### Database Testing (`test-utils/database.ts`)
```typescript
// Setup isolated test database
const testDataSource = await setupTestDatabase();

// Clean up between tests
await teardownTestDatabase();
```

### Mock Factory (`test-utils/mocks.ts`)
```typescript
// Pre-configured mocks for common dependencies
import { setupMocks, clearMocks, createTestUser } from '../test-utils/mocks';
```

### Test Runner (`test-utils/test-runner.ts`)
```bash
# Run specific test categories
npm run test:services
npm run test:controllers
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## ✅ Current Test Coverage

### Services Tested
- ✅ `AuthService` - Registration, login, token verification
- ✅ `WalletService` - Wallet creation and management (mocked)

### Controllers Tested  
- ✅ `AuthController` - Auth endpoints with validation

### Middleware Tested
- ✅ `AuthMiddleware` - Token validation and error handling

### Utils Tested
- ✅ `asyncHandler` - Async error handling wrapper

### Integration Tests
- ✅ User-Wallet registration flow
- ✅ Database consistency testing
- ✅ Authentication flow validation

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Run specific categories
npm test -- --testPathPattern="services"
npm test -- --testPathPattern="controllers" 
npm test -- --testPathPattern="integration"

# Run with coverage report
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### Custom Test Runner
```bash
# Using our custom test runner
npx ts-node src/test-utils/test-runner.ts --type services --coverage
npx ts-node src/test-utils/test-runner.ts --type integration --watch
```

## 📊 Test Configuration

### Jest Configuration (`jest.config.js`)
- **TypeScript Support**: ts-jest with proper configuration
- **Test Environment**: Node.js environment
- **Coverage**: Comprehensive coverage reporting
- **Setup Files**: Automated test setup and teardown

### Key Features
- In-memory SQLite for isolated database testing
- Comprehensive mocking strategy for external dependencies
- Parallel test execution for speed
- Automatic cleanup between tests

## 🔍 Testing Best Practices

### 1. **Test Organization**
```typescript
describe("AuthService", () => {
  describe("register", () => {
    test("should successfully register a new user", async () => {
      // Test implementation
    });
    
    test("should handle duplicate email error", async () => {
      // Error handling test
    });
  });
});
```

### 2. **Mock Strategy**
```typescript
// Mock external dependencies
jest.mock("@solana/web3.js", () => ({
  Keypair: {
    generate: jest.fn(() => mockKeypair)
  }
}));
```

### 3. **Database Testing**
```typescript
beforeAll(async () => {
  testDataSource = await setupTestDatabase();
});

beforeEach(async () => {
  await teardownTestDatabase(); // Clean slate for each test
});
```

### 4. **Assertion Patterns**
```typescript
// Verify successful responses
expect(response.body).toHaveProperty("user");
expect(response.body).toHaveProperty("token");

// Verify error handling
await expect(service.method()).rejects.toThrow("Expected error");

// Verify mock interactions
expect(mockService.method).toHaveBeenCalledWith(expectedArgs);
```

## 🎯 Next Steps for Expansion

### Priority Services to Test
1. **CarbonCreditsService** - Core business logic
2. **BlockchainService** - Solana integration
3. **ProjectService** - Project management
4. **OrganizationService** - Organization handling

### Additional Test Types
1. **Performance Tests** - Load testing for critical endpoints
2. **Security Tests** - Authentication and authorization edge cases
3. **Contract Tests** - API contract validation
4. **E2E Tests** - Full application workflow testing

### Continuous Integration
1. **GitHub Actions** - Automated test running
2. **Coverage Reports** - Code coverage tracking
3. **Test Quality Gates** - Minimum coverage requirements
4. **Performance Benchmarks** - Performance regression detection

## 📚 Testing Resources

### Dependencies
- **Jest**: Testing framework
- **Supertest**: HTTP integration testing
- **TypeORM**: Database testing with SQLite
- **Jest Mock Extended**: Enhanced mocking capabilities

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/usage-with-jest)

## 🤝 Contributing to Tests

### Adding New Tests
1. Create test file in appropriate `__tests__` subdirectory
2. Use existing test utilities and patterns
3. Follow naming convention: `*.test.ts`
4. Include both success and error scenarios

### Test Naming Convention
```typescript
// Good: Descriptive test names
test("should successfully register a new user with valid email and password")
test("should return 400 error when email is missing")

// Avoid: Vague test names  
test("registration test")
test("error case")
```

### Mock Guidelines
- Mock external dependencies (databases, APIs, crypto libraries)
- Keep mocks simple and focused
- Use factory functions for complex test data
- Clear mocks between tests for isolation

## 🏆 Success Metrics

### Current Status
- ✅ **Test Framework**: Fully configured Jest + TypeScript
- ✅ **Test Utilities**: Comprehensive helper functions
- ✅ **Database Testing**: In-memory SQLite setup
- ✅ **Mock Strategy**: External dependency isolation
- ✅ **Core Services**: Auth and Wallet services tested
- ✅ **API Testing**: Authentication endpoints covered
- ✅ **Integration Testing**: User workflow validation

### Coverage Goals
- **Unit Tests**: >80% line coverage for services
- **Integration Tests**: Critical user flows covered
- **Error Handling**: All error paths tested
- **Edge Cases**: Boundary conditions validated

This testing foundation provides a solid base for expanding test coverage as the CarbonPay platform grows! 🚀 