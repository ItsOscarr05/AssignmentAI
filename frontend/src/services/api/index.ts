import { api } from './api';
import { assignments } from './assignments';
import { classes } from './classes';
import { ErrorHandler } from './ErrorHandler';
import { submissions } from './submissions';
import { users } from './users';

// Create error handler instance
const errorHandler = new ErrorHandler();

// Add error handling interceptor
api.interceptors.response.use(
  response => response,
  error => errorHandler.handleError(error)
);

// Export API services
export { api, assignments, classes, submissions, users };
