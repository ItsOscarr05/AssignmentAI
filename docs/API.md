# AssignmentAI API Documentation

## Overview

This document provides detailed information about the AssignmentAI API endpoints, including request/response formats, authentication, and error handling.

## Base URL

```
https://api.assignmentai.com/v1
```

## Authentication

### JWT Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### API Key Authentication

For service-to-service communication:

```http
X-API-Key: <your_api_key>
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

## Endpoints

### Assignments

#### List Assignments

```http
GET /assignments
```

Query Parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (pending, submitted, graded)
- `sort` (string): Sort field (created_at, due_date, title)
- `order` (string): Sort order (asc, desc)

Response:

```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "due_date": "string (ISO 8601)",
      "status": "string",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)"
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "total_pages": "number"
  }
}
```

#### Get Assignment

```http
GET /assignments/{id}
```

Response:

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "due_date": "string (ISO 8601)",
  "status": "string",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)",
  "submissions": [
    {
      "id": "string",
      "user_id": "string",
      "status": "string",
      "submitted_at": "string (ISO 8601)",
      "grade": "number",
      "feedback": "string"
    }
  ]
}
```

#### Create Assignment

```http
POST /assignments
```

Request Body:

```json
{
  "title": "string",
  "description": "string",
  "due_date": "string (ISO 8601)",
  "max_score": "number",
  "attachments": [
    {
      "name": "string",
      "url": "string",
      "type": "string"
    }
  ]
}
```

Response:

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "due_date": "string (ISO 8601)",
  "status": "string",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

#### Update Assignment

```http
PUT /assignments/{id}
```

Request Body:

```json
{
  "title": "string",
  "description": "string",
  "due_date": "string (ISO 8601)",
  "status": "string"
}
```

Response:

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "due_date": "string (ISO 8601)",
  "status": "string",
  "updated_at": "string (ISO 8601)"
}
```

#### Delete Assignment

```http
DELETE /assignments/{id}
```

Response:

```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

### Submissions

#### List Submissions

```http
GET /assignments/{id}/submissions
```

Query Parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (pending, submitted, graded)
- `sort` (string): Sort field (submitted_at, grade)
- `order` (string): Sort order (asc, desc)

Response:

```json
{
  "data": [
    {
      "id": "string",
      "user_id": "string",
      "status": "string",
      "submitted_at": "string (ISO 8601)",
      "grade": "number",
      "feedback": "string"
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "total_pages": "number"
  }
}
```

#### Submit Assignment

```http
POST /assignments/{id}/submissions
```

Request Body:

```json
{
  "content": "string",
  "attachments": [
    {
      "name": "string",
      "url": "string",
      "type": "string"
    }
  ]
}
```

Response:

```json
{
  "id": "string",
  "user_id": "string",
  "status": "string",
  "submitted_at": "string (ISO 8601)",
  "content": "string",
  "attachments": [
    {
      "name": "string",
      "url": "string",
      "type": "string"
    }
  ]
}
```

#### Grade Submission

```http
PUT /assignments/{id}/submissions/{submission_id}/grade
```

Request Body:

```json
{
  "grade": "number",
  "feedback": "string"
}
```

Response:

```json
{
  "id": "string",
  "user_id": "string",
  "status": "string",
  "submitted_at": "string (ISO 8601)",
  "grade": "number",
  "feedback": "string",
  "graded_at": "string (ISO 8601)"
}
```

### Users

#### Get User Profile

```http
GET /users/me
```

Response:

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

#### Update User Profile

```http
PUT /users/me
```

Request Body:

```json
{
  "name": "string",
  "avatar": "string (URL)",
  "preferences": {
    "notifications": "boolean",
    "theme": "string"
  }
}
```

Response:

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "avatar": "string (URL)",
  "preferences": {
    "notifications": "boolean",
    "theme": "string"
  },
  "updated_at": "string (ISO 8601)"
}
```

### Analytics

#### Get Assignment Analytics

```http
GET /assignments/{id}/analytics
```

Response:

```json
{
  "total_submissions": "number",
  "average_grade": "number",
  "submission_timeline": [
    {
      "date": "string (ISO 8601)",
      "count": "number"
    }
  ],
  "grade_distribution": [
    {
      "range": "string",
      "count": "number"
    }
  ]
}
```

#### Get User Analytics

```http
GET /users/me/analytics
```

Response:

```json
{
  "total_assignments": "number",
  "completed_assignments": "number",
  "average_grade": "number",
  "submission_history": [
    {
      "assignment_id": "string",
      "title": "string",
      "submitted_at": "string (ISO 8601)",
      "grade": "number"
    }
  ]
}
```

## Webhooks

### Webhook Events

- `assignment.created`
- `assignment.updated`
- `assignment.deleted`
- `submission.created`
- `submission.graded`

### Webhook Payload Format

```json
{
  "event": "string",
  "timestamp": "string (ISO 8601)",
  "data": {
    "id": "string",
    "type": "string",
    "attributes": {}
  }
}
```

### Register Webhook

```http
POST /webhooks
```

Request Body:

```json
{
  "url": "string",
  "events": ["string"],
  "secret": "string"
}
```

Response:

```json
{
  "id": "string",
  "url": "string",
  "events": ["string"],
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AssignmentAI } from "@assignmentai/sdk";

const client = new AssignmentAI({
  apiKey: "your_api_key",
  baseUrl: "https://api.assignmentai.com/v1",
});

// List assignments
const assignments = await client.assignments.list({
  page: 1,
  limit: 10,
});

// Create assignment
const assignment = await client.assignments.create({
  title: "New Assignment",
  description: "Assignment description",
  due_date: "2024-03-20T00:00:00Z",
});

// Submit assignment
const submission = await client.submissions.create(assignment.id, {
  content: "Submission content",
  attachments: [
    {
      name: "document.pdf",
      url: "https://example.com/document.pdf",
      type: "application/pdf",
    },
  ],
});
```

### Python

```python
from assignmentai import AssignmentAI

client = AssignmentAI(
    api_key='your_api_key',
    base_url='https://api.assignmentai.com/v1'
)

# List assignments
assignments = client.assignments.list(
    page=1,
    limit=10
)

# Create assignment
assignment = client.assignments.create({
    'title': 'New Assignment',
    'description': 'Assignment description',
    'due_date': '2024-03-20T00:00:00Z'
})

# Submit assignment
submission = client.submissions.create(
    assignment.id,
    {
        'content': 'Submission content',
        'attachments': [
            {
                'name': 'document.pdf',
                'url': 'https://example.com/document.pdf',
                'type': 'application/pdf'
            }
        ]
    }
)
```

## Best Practices

### Rate Limiting

- Implement exponential backoff for retries
- Cache responses when appropriate
- Use bulk operations when available

### Error Handling

- Always check response status codes
- Implement proper error handling for network issues
- Log errors for debugging

### Security

- Keep API keys secure
- Use HTTPS for all requests
- Implement proper authentication
- Validate input data

### Performance

- Use pagination for large datasets
- Implement caching where appropriate
- Use compression for large payloads
- Monitor API usage and limits

## Support

For additional support:

- Email: support@assignmentai.com
- Documentation: https://docs.assignmentai.com
- GitHub Issues: https://github.com/assignmentai/api/issues
