import { z } from 'zod';

// Base schemas
const baseSchemas = {
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.number().int().positive(),
  metadata: z.record(z.unknown()).optional(),
};

// Assignment schema
export const assignmentSchema = z.object({
  id: baseSchemas.id,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  subject: z.string().min(1),
  tags: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        id: baseSchemas.id,
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number().positive(),
      })
    )
    .optional(),
  createdAt: baseSchemas.timestamp,
  updatedAt: baseSchemas.timestamp,
  version: baseSchemas.version,
  metadata: baseSchemas.metadata,
});

// Subject schema
export const subjectSchema = z.object({
  id: baseSchemas.id,
  name: z.string().min(1).max(100),
  userId: baseSchemas.id,
  createdAt: baseSchemas.timestamp,
  updatedAt: baseSchemas.timestamp,
  version: baseSchemas.version,
  metadata: baseSchemas.metadata,
});

// User schema
export const userSchema = z.object({
  id: baseSchemas.id,
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: baseSchemas.timestamp,
  updatedAt: baseSchemas.timestamp,
  version: baseSchemas.version,
  metadata: baseSchemas.metadata,
});
