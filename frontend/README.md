# AssignmentAI Frontend

A modern, accessible, and performant React application for managing assignments and submissions.

## Features

- 🎨 Modern UI with responsive design
- ♿️ Full accessibility support
- ⚡️ Performance optimized
- 🔒 Secure authentication
- 📱 Mobile-first approach
- 🌙 Dark mode support
- 🔄 Real-time updates
- 📊 Analytics integration

## Tech Stack

- React 18
- TypeScript
- Emotion (styled components)
- React Router v6
- Vite
- Jest & React Testing Library
- ESLint & Prettier

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/assignmentai.git
cd assignmentai/frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000
VITE_ANALYTICS_ID=your-analytics-id
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts
│   ├── hooks/         # Custom hooks
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── theme/         # Theme configuration
│   └── utils/         # Utility functions
├── public/            # Static assets
└── tests/            # Test files
```

## Performance Optimizations

- Code splitting and lazy loading
- Image optimization and caching
- Route-based code splitting
- Component memoization
- Virtualized lists for large datasets

## Accessibility Features

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast mode
- Skip links
- Focus management

## Testing

```bash
# Run tests
npm test
# or
yarn test

# Run tests with coverage
npm run test:coverage
# or
yarn test:coverage
```

## Building for Production

```bash
# Build the application
npm run build
# or
yarn build

# Preview the production build
npm run preview
# or
yarn preview
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

### Components

Each component in the `components` directory has its own documentation. See the individual component files for detailed usage instructions.

### Hooks

Custom hooks are documented in the `hooks` directory. Each hook includes:

- Purpose
- Parameters
- Return values
- Usage examples

### API Integration

API services are documented in the `services` directory. Each service includes:

- Endpoints
- Request/response types
- Error handling
- Usage examples

## Performance Monitoring

The application includes built-in performance monitoring:

- Page load times
- Component render times
- API response times
- Error tracking
- User analytics

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
