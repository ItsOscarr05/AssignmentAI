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

- Frontend: React, TypeScript, Material-UI
- Backend: Node.js, Express
- Database: MongoDB
- AI Integration: OpenAI API
- Authentication: JWT
- File Storage: AWS S3
- Testing: Jest, React Testing Library
- Internationalization: i18next

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS S3 account (for file storage)
- OpenAI API key

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
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Configure environment variables:

   ```bash
   # Backend (.env)
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/assignmentai
   JWT_SECRET=your_jwt_secret
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_bucket_name
   OPENAI_API_KEY=your_openai_api_key

   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:3000
   ```

4. Start the development servers:

   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
assignmentai/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── i18n/
│   └── package.json
└── README.md
```

## API Documentation

See [API.md](docs/API.md) for detailed API documentation.

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

## Environment Variables

See [Environment Variables Documentation](docs/environment-variables.md) for detailed information about required environment variables.

## Documentation

- [API Documentation](docs/api.md)

- [Environment Variables](docs/environment-variables.md)
- [Deployment Guide](docs/deployment.md)
