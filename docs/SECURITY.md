# AssignmentAI Security Guide

## Overview

This guide provides comprehensive information about security measures implemented in the AssignmentAI application, including authentication, authorization, data protection, and security best practices.

## Authentication

### JWT Authentication

```typescript
// auth/jwt.ts
import jwt from "jsonwebtoken";
import { config } from "../config";

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: "24h",
      algorithm: "HS256",
    }
  );
};

export const verifyToken = (token: string): User => {
  try {
    return jwt.verify(token, config.jwtSecret) as User;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
```

### Password Hashing

```typescript
// auth/password.ts
import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### Two-Factor Authentication

```typescript
// auth/2fa.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export const generate2FASecret = async (): Promise<{
  secret: string;
  qrCode: string;
}> => {
  const secret = speakeasy.generateSecret();
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return { secret: secret.base32, qrCode };
};

export const verify2FAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });
};
```

## Authorization

### Role-Based Access Control

```typescript
// auth/rbac.ts
export enum Role {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export const permissions = {
  [Role.STUDENT]: ["view:assignments", "submit:assignments", "view:grades"],
  [Role.TEACHER]: [
    "view:assignments",
    "create:assignments",
    "grade:assignments",
    "view:submissions",
  ],
  [Role.ADMIN]: [
    "view:assignments",
    "create:assignments",
    "grade:assignments",
    "view:submissions",
    "manage:users",
    "manage:system",
  ],
};

export const hasPermission = (user: User, permission: string): boolean => {
  return permissions[user.role].includes(permission);
};
```

### Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth/jwt";
import { hasPermission } from "../auth/rbac";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new Error("No token provided");
    }

    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const authorize = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
```

## Data Protection

### Input Validation

```typescript
// validation/schemas.ts
import { z } from "zod";

export const assignmentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  dueDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Due date must be in the future",
  }),
  maxScore: z
    .number()
    .min(0, "Score must be positive")
    .max(100, "Score must be less than 100"),
});

export const validateAssignment = (data: unknown) => {
  return assignmentSchema.parse(data);
};
```

### XSS Protection

```typescript
// security/xss.ts
import xss from "xss";

export const sanitizeInput = (input: string): string => {
  return xss(input, {
    whiteList: {
      p: ["class"],
      a: ["href", "target"],
      b: [],
      i: [],
      u: [],
      strong: [],
      em: [],
    },
  });
};
```

### CSRF Protection

```typescript
// security/csrf.ts
import csrf from "csurf";

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

export const generateCSRFToken = (req: Request): string => {
  return req.csrfToken();
};
```

## API Security

### Rate Limiting

```typescript
// security/rateLimit.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../services/redis";

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rate-limit:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
```

### Request Validation

```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { validateAssignment } from "../validation/schemas";

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: error.errors });
    }
  };
};
```

## Data Encryption

### File Encryption

```typescript
// security/encryption.ts
import crypto from "crypto";

export const encryptFile = (
  buffer: Buffer
): {
  encrypted: Buffer;
  iv: Buffer;
} => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.ENCRYPTION_KEY!),
    iv
  );

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return { encrypted, iv };
};

export const decryptFile = (encrypted: Buffer, iv: Buffer): Buffer => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.ENCRYPTION_KEY!),
    iv
  );

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
```

### Sensitive Data Encryption

```typescript
// security/sensitive.ts
import { encrypt, decrypt } from "crypto-js";

export const encryptSensitiveData = (data: string): string => {
  return encrypt(data, process.env.ENCRYPTION_KEY!).toString();
};

export const decryptSensitiveData = (encrypted: string): string => {
  return decrypt(encrypted, process.env.ENCRYPTION_KEY!).toString();
};
```

## Security Headers

### Express Security Middleware

```typescript
// middleware/security.ts
import helmet from "helmet";
import cors from "cors";

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.assignmentai.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
];
```

## Logging and Monitoring

### Security Logging

```typescript
// security/logging.ts
import winston from "winston";

export const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "logs/security.log",
      level: "info",
    }),
  ],
});

export const logSecurityEvent = (event: string, details: any): void => {
  securityLogger.info(event, {
    timestamp: new Date().toISOString(),
    ...details,
  });
};
```

### Security Monitoring

```typescript
// security/monitoring.ts
import { prometheus } from "../services/monitoring";

export const securityMetrics = {
  failedLogins: new prometheus.Counter({
    name: "security_failed_logins_total",
    help: "Total number of failed login attempts",
  }),
  suspiciousActivities: new prometheus.Counter({
    name: "security_suspicious_activities_total",
    help: "Total number of suspicious activities detected",
  }),
  blockedRequests: new prometheus.Counter({
    name: "security_blocked_requests_total",
    help: "Total number of blocked requests",
  }),
};
```

## Security Best Practices

### Password Policies

```typescript
// security/password.ts
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};
```

### Session Management

```typescript
// security/session.ts
import { Redis } from "ioredis";

export class SessionManager {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString("hex");
    await this.redis.setex(
      `session:${sessionId}`,
      24 * 60 * 60, // 24 hours
      userId
    );
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<string | null> {
    return this.redis.get(`session:${sessionId}`);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

## Security Checklist

### Development

1. **Code Security**

   - Use TypeScript for type safety
   - Implement input validation
   - Sanitize user input
   - Use parameterized queries
   - Implement proper error handling

2. **Dependencies**

   - Regular security audits
   - Keep dependencies updated
   - Use lock files
   - Monitor for vulnerabilities

3. **Configuration**
   - Use environment variables
   - Secure sensitive data
   - Implement proper logging
   - Use secure defaults

### Deployment

1. **Infrastructure**

   - Use HTTPS
   - Implement WAF
   - Configure firewalls
   - Regular backups

2. **Monitoring**

   - Log security events
   - Monitor for anomalies
   - Set up alerts
   - Regular audits

3. **Access Control**
   - Principle of least privilege
   - Regular access reviews
   - Secure credential management
   - Implement 2FA

## Incident Response

### Security Incident Plan

1. **Detection**

   - Monitor security logs
   - Review alerts
   - Investigate anomalies
   - Document findings

2. **Response**

   - Isolate affected systems
   - Block malicious traffic
   - Reset compromised credentials
   - Notify stakeholders

3. **Recovery**
   - Restore from backups
   - Patch vulnerabilities
   - Update security measures
   - Document lessons learned

## Compliance

### GDPR Compliance

```typescript
// security/gdpr.ts
export const handleDataRequest = async (
  userId: string,
  requestType: "export" | "delete"
): Promise<void> => {
  if (requestType === "export") {
    // Export user data
    const userData = await getUserData(userId);
    await exportData(userData);
  } else {
    // Delete user data
    await deleteUserData(userId);
  }
};
```

### Data Retention

```typescript
// security/retention.ts
export const cleanupExpiredData = async (): Promise<void> => {
  const retentionPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
  const cutoffDate = new Date(Date.now() - retentionPeriod);

  await db.submissions.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });
};
```

## Support

For security-related issues:

- Email: security@assignmentai.com
- Security Policy: https://assignmentai.com/security
- Responsible Disclosure: https://assignmentai.com/security/disclosure
- Security Updates: https://assignmentai.com/security/updates
