# AssignmentAI Testing Guide

## Overview

This guide provides comprehensive information about testing the AssignmentAI application, including unit tests, integration tests, end-to-end tests, performance tests, and accessibility tests.

## Testing Strategy

### Test Pyramid

```
┌─────────────────┐
│   E2E Tests     │ 10%
├─────────────────┤
│ Integration     │ 20%
│ Tests           │
├─────────────────┤
│   Unit Tests    │ 70%
└─────────────────┘
```

### Test Categories

1. **Unit Tests**: Testing individual components and functions
2. **Integration Tests**: Testing component interactions and API endpoints
3. **End-to-End Tests**: Testing complete user flows
4. **Performance Tests**: Testing application performance and scalability
5. **Accessibility Tests**: Testing WCAG compliance and screen reader compatibility

## Unit Testing

### Frontend Unit Tests

#### Component Testing

```typescript
// AssignmentCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import AssignmentCard from "./AssignmentCard";

describe("AssignmentCard", () => {
  const mockAssignment = {
    id: "1",
    title: "Test Assignment",
    description: "Test Description",
    dueDate: "2024-03-20",
    status: "pending",
  };

  it("renders assignment details correctly", () => {
    render(<AssignmentCard assignment={mockAssignment} />);

    expect(screen.getByText("Test Assignment")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Due: 2024-03-20")).toBeInTheDocument();
  });

  it("handles status change", () => {
    const onStatusChange = jest.fn();
    render(
      <AssignmentCard
        assignment={mockAssignment}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByText("Mark Complete"));
    expect(onStatusChange).toHaveBeenCalledWith("1", "completed");
  });
});
```

#### Hook Testing

```typescript
// useAssignment.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import useAssignment from "./useAssignment";

describe("useAssignment", () => {
  it("loads assignment data", async () => {
    const { result } = renderHook(() => useAssignment("1"));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.assignment).toBeDefined();
  });

  it("handles errors", async () => {
    const { result } = renderHook(() => useAssignment("invalid-id"));

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Backend Unit Tests

#### Service Testing

```typescript
// assignmentService.test.ts
import { AssignmentService } from "./assignmentService";
import { mockDb } from "./__mocks__/db";

describe("AssignmentService", () => {
  let service: AssignmentService;

  beforeEach(() => {
    service = new AssignmentService(mockDb);
  });

  it("creates new assignment", async () => {
    const assignment = await service.create({
      title: "Test Assignment",
      description: "Test Description",
      dueDate: "2024-03-20",
    });

    expect(assignment.id).toBeDefined();
    expect(assignment.title).toBe("Test Assignment");
  });

  it("validates assignment data", async () => {
    await expect(
      service.create({
        title: "",
        description: "",
        dueDate: "invalid-date",
      })
    ).rejects.toThrow("Invalid assignment data");
  });
});
```

#### Controller Testing

```typescript
// assignmentController.test.ts
import { AssignmentController } from "./assignmentController";
import { mockRequest, mockResponse } from "./__mocks__/express";

describe("AssignmentController", () => {
  let controller: AssignmentController;

  beforeEach(() => {
    controller = new AssignmentController();
  });

  it("handles assignment creation", async () => {
    const req = mockRequest({
      body: {
        title: "Test Assignment",
        description: "Test Description",
        dueDate: "2024-03-20",
      },
    });
    const res = mockResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Assignment",
      })
    );
  });
});
```

## Integration Testing

### Frontend Integration Tests

#### Component Integration

```typescript
// AssignmentForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AssignmentForm from "./AssignmentForm";
import { AssignmentProvider } from "./AssignmentContext";

describe("AssignmentForm Integration", () => {
  it("submits assignment data", async () => {
    render(
      <AssignmentProvider>
        <AssignmentForm />
      </AssignmentProvider>
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Test Assignment" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Test Description" },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        screen.getByText("Assignment created successfully")
      ).toBeInTheDocument();
    });
  });
});
```

### Backend Integration Tests

#### API Integration

```typescript
// assignmentApi.test.ts
import request from "supertest";
import app from "./app";
import { setupTestDb, teardownTestDb } from "./testUtils";

describe("Assignment API Integration", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);

  it("creates and retrieves assignment", async () => {
    // Create assignment
    const createResponse = await request(app).post("/api/assignments").send({
      title: "Test Assignment",
      description: "Test Description",
      dueDate: "2024-03-20",
    });

    expect(createResponse.status).toBe(201);
    const assignmentId = createResponse.body.id;

    // Retrieve assignment
    const getResponse = await request(app).get(
      `/api/assignments/${assignmentId}`
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.title).toBe("Test Assignment");
  });
});
```

## End-to-End Testing

### Cypress Tests

```typescript
// assignment.cy.ts
describe("Assignment Management", () => {
  beforeEach(() => {
    cy.login("testuser@example.com", "password");
    cy.visit("/assignments");
  });

  it("creates new assignment", () => {
    cy.get('[data-testid="create-assignment-btn"]').click();

    cy.get('[data-testid="assignment-title"]').type("Test Assignment");
    cy.get('[data-testid="assignment-description"]').type("Test Description");
    cy.get('[data-testid="assignment-due-date"]').type("2024-03-20");

    cy.get('[data-testid="submit-btn"]').click();

    cy.get('[data-testid="success-message"]').should(
      "contain",
      "Assignment created successfully"
    );
  });

  it("submits assignment", () => {
    cy.get('[data-testid="assignment-card"]').first().click();

    cy.get('[data-testid="submission-content"]').type("Test Submission");
    cy.get('[data-testid="submit-assignment-btn"]').click();

    cy.get('[data-testid="submission-status"]').should("contain", "Submitted");
  });
});
```

## Performance Testing

### Load Testing

```typescript
// loadTest.ts
import { check } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up to 20 users
    { duration: "1m", target: 20 }, // Stay at 20 users
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.1"], // Less than 10% of requests can fail
  },
};

export default function () {
  const response = http.get("http://api.assignmentai.com/assignments");

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
}
```

### Memory Testing

```typescript
// memoryTest.ts
import { check } from "k6";
import http from "k6/http";

export const options = {
  thresholds: {
    heap_used: ["max<500MB"],
    heap_alloc: ["max<1GB"],
  },
};

export default function () {
  const response = http.get("http://api.assignmentai.com/assignments");

  check(response, {
    "memory usage is within limits": () => {
      const heapUsed = process.memoryUsage().heapUsed;
      return heapUsed < 500 * 1024 * 1024; // 500MB
    },
  });
}
```

## Accessibility Testing

### Automated Testing

```typescript
// accessibility.test.tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import AssignmentCard from "./AssignmentCard";

expect.extend(toHaveNoViolations);

describe("AssignmentCard Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <AssignmentCard
        assignment={{
          id: "1",
          title: "Test Assignment",
          description: "Test Description",
          dueDate: "2024-03-20",
          status: "pending",
        }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

1. **Keyboard Navigation**

   - Tab through all interactive elements
   - Use arrow keys for navigation
   - Check focus indicators

2. **Screen Reader Testing**

   - Test with NVDA
   - Test with VoiceOver
   - Verify ARIA labels

3. **Color Contrast**

   - Check text contrast ratios
   - Verify color is not the only indicator
   - Test with color blindness simulators

4. **Form Accessibility**
   - Verify form labels
   - Check error messages
   - Test required fields

## Testing Tools

### Frontend Testing Tools

- Jest
- React Testing Library
- Cypress
- Storybook
- axe-core

### Backend Testing Tools

- Jest
- Supertest
- k6
- Mocha
- Chai

### CI/CD Integration

#### GitHub Actions Workflow

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Run accessibility tests
        run: npm run test:a11y
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/serviceWorker.ts",
  ],
};
```

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Best Practices

### Test Organization

1. **File Structure**

   ```
   src/
   ├── components/
   │   ├── AssignmentCard/
   │   │   ├── AssignmentCard.tsx
   │   │   ├── AssignmentCard.test.tsx
   │   │   └── index.ts
   │   └── ...
   ├── hooks/
   │   ├── useAssignment/
   │   │   ├── useAssignment.ts
   │   │   ├── useAssignment.test.ts
   │   │   └── index.ts
   │   └── ...
   └── ...
   ```

2. **Test Naming**
   - Use descriptive names
   - Follow pattern: `[Component/Function] should [expected behavior]`
   - Group related tests using `describe` blocks

### Testing Guidelines

1. **Unit Tests**

   - Test one thing at a time
   - Use meaningful assertions
   - Mock external dependencies
   - Test edge cases

2. **Integration Tests**

   - Test component interactions
   - Test API endpoints
   - Use test databases
   - Clean up after tests

3. **E2E Tests**

   - Test critical user flows
   - Use realistic data
   - Handle async operations
   - Test error scenarios

4. **Performance Tests**

   - Set realistic thresholds
   - Test under load
   - Monitor memory usage
   - Test network conditions

5. **Accessibility Tests**
   - Test with screen readers
   - Check keyboard navigation
   - Verify ARIA attributes
   - Test color contrast

### Common Pitfalls

1. **Flaky Tests**

   - Use stable selectors
   - Handle async operations properly
   - Clean up test state
   - Use proper timeouts

2. **Slow Tests**

   - Mock expensive operations
   - Use test databases
   - Parallelize test runs
   - Optimize test setup

3. **Maintenance Issues**
   - Keep tests simple
   - Use helper functions
   - Document test requirements
   - Regular test reviews

## Support

For additional testing support:

- Documentation: https://docs.assignmentai.com/testing
- GitHub Issues: https://github.com/assignmentai/testing/issues
- Testing Slack Channel: #assignmentai-testing
