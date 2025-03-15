# AssignmentAI Frontend

A modern React application for managing student assignments with AI assistance.

## Features

- User authentication and authorization
- Assignment management (create, read, update, delete)
- AI-powered assignment suggestions
- Real-time updates
- Infinite scrolling
- Optimistic updates
- Responsive design

## Technology Stack

- React 18
- Material-UI v5
- React Query v5
- React Router v6
- Axios
- Jest & React Testing Library
- MSW (Mock Service Worker)

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/assignmentai.git
cd assignmentai/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment files:

- Copy `.env.development` for local development
- Copy `.env.production` for production builds
- Update the API URLs and other configurations as needed

4. Start the development server:

```bash
npm start
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run test:coverage` - Runs tests with coverage report
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Project Structure

```
src/
├── components/        # React components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── lib/             # Utility functions and configurations
├── mocks/           # API mocking for tests
├── styles/          # Global styles and themes
└── tests/           # Test utilities and setup
```

## Data Management

### React Query Configuration

The application uses React Query for data fetching and caching with the following features:

- Automatic background refetching
- Optimistic updates
- Infinite scrolling
- Prefetching
- Error handling
- Cache invalidation

### Caching Strategy

- Query data is considered fresh for 5 minutes
- Cache is kept for 30 minutes
- Failed requests are retried twice
- Mutations are retried once
- Background updates on reconnection

## Testing

The project uses Jest and React Testing Library for testing with the following setup:

- Mock Service Worker for API mocking
- Custom test utilities and providers
- Coverage thresholds set to 80%
- Automatic test running on push

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
