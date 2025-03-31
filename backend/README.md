# AssignmentAI Backend

A FastAPI-based backend for the AssignmentAI educational platform.

## Features

- 👩‍🏫 Teacher Management

  - Create and manage assignments
  - Track student progress
  - Generate AI-powered assignments

- 👨‍🎓 Student Experience

  - Submit assignments
  - View grades and feedback
  - Track progress

- 🔐 Authentication

  - Secure JWT-based authentication
  - Role-based access control
  - Email verification

- 📊 Administration
  - User management
  - System monitoring
  - Activity logging

## Prerequisites

- Python 3.8+
- PostgreSQL
- Virtual environment (recommended)

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd backend
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file:

```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assignmentai

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Email Configuration
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

6. Initialize the database:

```bash
alembic upgrade head
```

7. Run the development server:

```bash
uvicorn app.main:app --reload
```

## Testing

1. Run tests:

```bash
pytest
```

2. Run tests with coverage report:

```bash
pytest --cov=app --cov-report=html
```

3. Run specific test file:

```bash
pytest tests/test_auth.py -v
```

## API Documentation

Once the server is running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

## Development

1. Format code:

```bash
black .
```

2. Sort imports:

```bash
isort .
```

3. Run linter:

```bash
flake8
```

4. Run type checker:

```bash
mypy .
```

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/             # API endpoints
│   ├── core/            # Core functionality
│   ├── crud/            # Database operations
│   ├── db/              # Database configuration
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── services/        # Business logic
├── tests/               # Test files
├── .env                 # Environment variables
├── alembic.ini          # Alembic configuration
└── requirements.txt     # Python dependencies
```

## Contributing

1. Create a new branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
