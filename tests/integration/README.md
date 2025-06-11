# Integration Tests

This directory contains integration tests for the AssignmentAI application. The tests are organized into several categories:

## Frontend-Backend Integration Tests

- API communication tests
- Data flow validation
- Error handling scenarios
- Authentication flows

## End-to-End Tests

- User flows
- Critical paths
- Edge cases

## Test Structure

```
integration/
├── api/                 # API integration tests
│   ├── auth/           # Authentication tests
│   ├── data/           # Data flow tests
│   └── error/          # Error handling tests
├── e2e/                # End-to-end tests
│   ├── flows/          # User flow tests
│   ├── critical/       # Critical path tests
│   └── edge/           # Edge case tests
└── fixtures/           # Test fixtures and mock data
```

## Running Tests

1. Start the development servers:

   ```bash
   # Terminal 1 - Backend
   cd backend
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Run the integration tests:

   ```bash
   # Run all integration tests
   npm run test:integration

   # Run specific test categories
   npm run test:integration:api
   npm run test:integration:e2e
   ```

## Test Environment Setup

- Tests use a dedicated test database
- Mock services are used for external dependencies
- Test data is reset before each test suite
- Environment variables are loaded from .env.test

## Writing New Tests

1. Create test files in the appropriate category directory
2. Use the provided test utilities and fixtures
3. Follow the established patterns for test structure
4. Include both positive and negative test cases
5. Document any special setup requirements
