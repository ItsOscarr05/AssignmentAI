# Environment Configuration

This directory contains configuration files to easily switch between development, production, and test modes.

## Quick Start

### Method 1: Using the Script (Recommended)

```bash
# Switch to development mode
npm run dev:switch

# Switch to production mode
npm run prod:switch

# Switch to test mode
npm run test:switch

# Check current mode
npm run env:status
```

### Method 2: Manual Edit

Edit `src/config/environment.ts` and change this line:

```typescript
const CURRENT_MODE: EnvironmentConfig['mode'] = 'development'; // Change to 'production' or 'test'
```

## Usage in Code

```typescript
import { config, debug, isDevelopment, isProduction } from '../config/environment';

// Check current mode
if (isDevelopment()) {
  console.log('Running in development mode');
}

// Use configuration
const apiUrl = config.apiBaseUrl;
const timeout = config.testTimeout;

// Use debug helpers (only logs in development/test)
debug.log('This will only show in dev/test mode');
debug.warn('Warning message');
debug.error('Error message');
```

## Configuration Options

| Option                 | Development                 | Production                         | Test                        |
| ---------------------- | --------------------------- | ---------------------------------- | --------------------------- |
| `apiBaseUrl`           | `http://localhost:8000/api` | `https://api.assignmentai.com/api` | `http://localhost:8000/api` |
| `enableDebugLogs`      | `true`                      | `false`                            | `true`                      |
| `enableAnalytics`      | `false`                     | `true`                             | `false`                     |
| `enableErrorReporting` | `false`                     | `true`                             | `false`                     |
| `testTimeout`          | `10000`                     | `5000`                             | `10000`                     |
| `mockData`             | `true`                      | `false`                            | `true`                      |

## Environment Variables

The configuration automatically sets these environment variables:

- `NODE_ENV`
- `VITE_API_BASE_URL`
- `VITE_ENABLE_DEBUG`
- `VITE_ENABLE_ANALYTICS`
- `VITE_ENABLE_ERROR_REPORTING`
- `VITE_TEST_TIMEOUT`
- `VITE_MOCK_DATA`

## Testing

When running tests, the configuration automatically:

- Enables debug logs
- Uses mock data
- Sets longer timeouts
- Disables analytics and error reporting

This makes it easy to run tests in a controlled environment without affecting production settings.
