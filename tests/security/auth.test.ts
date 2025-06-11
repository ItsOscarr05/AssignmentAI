import request from 'supertest';
import { app } from '../../backend/src/app';
import { createTestUser, deleteTestUser } from '../utils/test-utils';

describe('Security Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(testUser.id);
  });

  describe('Authentication', () => {
    it('should not allow access to protected routes without token', async () => {
      const response = await request(app).get('/api/assignments').expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .get('/api/assignments')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should not allow access with expired token', async () => {
      const response = await request(app)
        .get('/api/assignments')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.error).toBe('Token expired');
    });
  });

  describe('Authorization', () => {
    it('should not allow regular users to access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should not allow users to access other users data', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id + 1}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('Input Validation', () => {
    it('should prevent SQL injection in login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should prevent XSS in assignment creation', async () => {
      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '<script>alert("xss")</script>',
          description: 'Test Description',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid input');
    });
  });
});
