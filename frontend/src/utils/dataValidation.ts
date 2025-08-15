import { z } from 'zod';

// Base schemas for common data types
export const baseSchemas = {
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
  dueDate: z.string().datetime(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
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

// Submission schema
export const submissionSchema = z.object({
  id: baseSchemas.id,
  assignmentId: baseSchemas.id,
  userId: baseSchemas.id,
  content: z.string(),
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
  status: z.enum(['draft', 'submitted', 'graded']),
  grade: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  submittedAt: baseSchemas.timestamp.optional(),
  createdAt: baseSchemas.timestamp,
  updatedAt: baseSchemas.timestamp,
  version: baseSchemas.version,
  metadata: baseSchemas.metadata,
});

// User preferences schema
export const userPreferencesSchema = z.object({
  id: baseSchemas.id,
  userId: baseSchemas.id,
  theme: z.enum(['light', 'dark', 'system']),
  fontSize: z.number().min(12).max(24),

  language: z.string().min(2).max(5),

  createdAt: baseSchemas.timestamp,
  updatedAt: baseSchemas.timestamp,
  version: baseSchemas.version,
  metadata: baseSchemas.metadata,
});

// Data validation utility
export class DataValidator {
  private static instance: DataValidator;
  private schemas: Map<string, z.ZodType<any>>;

  private constructor() {
    this.schemas = new Map<string, z.ZodType<any>>([
      ['assignment', assignmentSchema],
      ['submission', submissionSchema],
      ['userPreferences', userPreferencesSchema],
    ]);
  }

  public static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator();
    }
    return DataValidator.instance;
  }

  public validate<T>(type: string, data: unknown): { success: boolean; data?: T; error?: string } {
    const schema = this.schemas.get(type);
    if (!schema) {
      return {
        success: false,
        error: `Schema not found for type: ${type}`,
      };
    }

    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData as T,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        };
      }
      return {
        success: false,
        error: 'Unknown validation error',
      };
    }
  }

  public addSchema(type: string, schema: z.ZodType<any>): void {
    this.schemas.set(type, schema);
  }

  public removeSchema(type: string): void {
    this.schemas.delete(type);
  }
}

// Data transformation utility
export class DataTransformer {
  private static instance: DataTransformer;
  private transformers: Map<
    string,
    {
      toServer: (data: any) => any;
      fromServer: (data: any) => any;
    }
  >;

  private constructor() {
    this.transformers = new Map([
      [
        'assignment',
        {
          toServer: (data: any) => ({
            ...data,
            updatedAt: new Date().toISOString(),
          }),
          fromServer: (data: any) => ({
            ...data,
            dueDate: new Date(data.dueDate),
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          }),
        },
      ],
      [
        'submission',
        {
          toServer: (data: any) => ({
            ...data,
            updatedAt: new Date().toISOString(),
          }),
          fromServer: (data: any) => ({
            ...data,
            submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          }),
        },
      ],
      [
        'userPreferences',
        {
          toServer: (data: any) => ({
            ...data,
            updatedAt: new Date().toISOString(),
          }),
          fromServer: (data: any) => ({
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          }),
        },
      ],
    ]);
  }

  public static getInstance(): DataTransformer {
    if (!DataTransformer.instance) {
      DataTransformer.instance = new DataTransformer();
    }
    return DataTransformer.instance;
  }

  public transform<T>(type: string, data: any, direction: 'toServer' | 'fromServer'): T {
    const transformer = this.transformers.get(type);
    if (!transformer) {
      return data;
    }

    return transformer[direction](data) as T;
  }

  public addTransformer(
    type: string,
    toServer: (data: any) => any,
    fromServer: (data: any) => any
  ): void {
    this.transformers.set(type, { toServer, fromServer });
  }

  public removeTransformer(type: string): void {
    this.transformers.delete(type);
  }
}

// Example usage:
/*
const validator = DataValidator.getInstance();
const transformer = DataTransformer.getInstance();

// Validate assignment data
const assignmentData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'My Assignment',
  description: 'Description here',
  dueDate: new Date().toISOString(),
  status: 'pending',
  priority: 'high',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
};

const validationResult = validator.validate('assignment', assignmentData);
if (validationResult.success && validationResult.data) {
  // Transform data before sending to server
  const serverData = transformer.transform('assignment', validationResult.data, 'toServer');
  
  // Send to server...
  
  // Transform data received from server
  const clientData = transformer.transform('assignment', serverData, 'fromServer');
}
*/
