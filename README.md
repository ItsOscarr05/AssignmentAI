# AssignmentAI

A comprehensive assignment management system with AI-powered features for educational institutions.

## Features

- 🔐 Secure Authentication System
- 📝 Assignment Management
- 🤖 AI Integration for Assignment Analysis
- 📁 File Management
- 💬 Communication System
- 📊 Analytics and Reporting
- 📱 Responsive Dashboard
- 👤 Profile Management
- ⚙️ Settings Customization
- Assignment management
- AI-powered feedback
- User authentication
- File storage

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI, Vite
- **Backend**: FastAPI, Python 3.8+, PostgreSQL
- **Database**: PostgreSQL with Alembic migrations
- **AI Integration**: OpenAI API with tiered model access
- **Authentication**: JWT with 2FA support
- **File Storage**: Local storage with S3 support
- **Testing**: Vitest, React Testing Library
- **Containerization**: Docker with Docker Compose
- **Monitoring**: Prometheus, Grafana

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+ (optional)
- Docker (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/assignmentai.git
   cd assignmentai
   ```

2. Install dependencies:

   ```bash
   # Install backend dependencies
   cd backend
   pip install -r requirements.txt

   # Install frontend dependencies
   cd ../frontend
   pnpm install
   ```

3. Configure environment variables:

   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://username:password@localhost:5432/assignmentai
   JWT_SECRET_KEY=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret

   # Frontend (.env)
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development servers:

   ```bash
   # Start backend server
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Start frontend server
   cd ../frontend
   pnpm dev
   ```

## Project Structure

```
assignmentai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── __tests__/
│   └── package.json
└── README.md
```

## Documentation

- [API Documentation](API_DOCUMENTATION.md)
- [Environment Setup](ENVIRONMENT_SETUP.md)
- [Security Guide](SECURITY_GUIDE.md)
- [User Guide](USER_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Production Monitoring](PRODUCTION_MONITORING_GUIDE.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@assignmentai.com or open an issue in the repository.
