# AssignmentAI Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git
- MongoDB (v5 or higher)
- Redis (v6 or higher)

## Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/assignmentai.git
cd assignmentai
```

2. Install dependencies:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:

Frontend (.env):

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_GA_TRACKING_ID=your-ga-id
```

Backend (.env):

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/assignmentai
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Development Setup

1. Start the development servers:

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

2. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## Production Deployment

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Build the backend:

```bash
cd backend
npm run build
```

3. Start the production servers:

```bash
# Frontend (using serve)
npx serve -s frontend/build

# Backend
cd backend
npm start
```

## Docker Deployment

1. Build the Docker images:

```bash
# Frontend
docker build -t assignmentai-frontend -f frontend/Dockerfile .

# Backend
docker build -t assignmentai-backend -f backend/Dockerfile .
```

2. Run the containers:

```bash
docker-compose up -d
```

## Database Setup

1. Start MongoDB:

```bash
# Local
mongod

# Docker
docker run -d -p 27017:27017 mongo:latest
```

2. Start Redis:

```bash
# Local
redis-server

# Docker
docker run -d -p 6379:6379 redis:latest
```

## Testing

1. Run frontend tests:

```bash
cd frontend
npm test
```

2. Run backend tests:

```bash
cd backend
npm test
```

3. Run end-to-end tests:

```bash
npm run test:e2e
```

## Contributing Guidelines

### Code Style

1. **Frontend**

   - Use TypeScript for all new code
   - Follow ESLint configuration
   - Use Prettier for code formatting
   - Follow React best practices

2. **Backend**
   - Use TypeScript for all new code
   - Follow ESLint configuration
   - Use Prettier for code formatting
   - Follow Node.js best practices

### Git Workflow

1. **Branch Naming**

   - feature/feature-name
   - bugfix/bug-description
   - hotfix/issue-description
   - release/version-number

2. **Commit Messages**

   - Use conventional commits
   - Format: type(scope): description
   - Types: feat, fix, docs, style, refactor, test, chore

3. **Pull Requests**
   - Create feature branches from develop
   - Keep PRs small and focused
   - Include tests for new features
   - Update documentation

### Development Process

1. **Starting Work**

   - Create a new branch
   - Update dependencies
   - Run tests
   - Start development server

2. **During Development**

   - Write tests first
   - Follow coding standards
   - Commit frequently
   - Keep commits atomic

3. **Before Submitting**
   - Run all tests
   - Fix linting issues
   - Update documentation
   - Create PR

### Code Review Process

1. **Reviewer Responsibilities**

   - Check code quality
   - Verify tests
   - Review documentation
   - Test functionality

2. **Author Responsibilities**
   - Address review comments
   - Update code as needed
   - Keep PR up to date
   - Merge after approval

### Documentation

1. **Code Documentation**

   - Document functions and classes
   - Include JSDoc comments
   - Explain complex logic
   - Update README

2. **API Documentation**
   - Document endpoints
   - Include examples
   - Update OpenAPI spec
   - Document changes

### Testing Requirements

1. **Unit Tests**

   - Test all new functions
   - Mock external dependencies
   - Cover edge cases
   - Maintain coverage

2. **Integration Tests**

   - Test API endpoints
   - Test database operations
   - Test external services
   - Test error cases

3. **End-to-End Tests**
   - Test user flows
   - Test critical paths
   - Test responsive design
   - Test accessibility

### Performance Guidelines

1. **Frontend**

   - Optimize bundle size
   - Implement code splitting
   - Use lazy loading
   - Monitor performance

2. **Backend**
   - Optimize database queries
   - Implement caching
   - Monitor response times
   - Handle load properly

### Security Guidelines

1. **Code Security**

   - Follow security best practices
   - Validate user input
   - Sanitize output
   - Handle errors properly

2. **Data Security**
   - Encrypt sensitive data
   - Use secure protocols
   - Implement proper auth
   - Follow OWASP guidelines

### Deployment Guidelines

1. **Staging**

   - Deploy to staging first
   - Run integration tests
   - Check performance
   - Verify security

2. **Production**
   - Use proper environment
   - Monitor logs
   - Set up alerts
   - Have rollback plan
