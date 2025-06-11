module.exports = {
  // Authentication & Authorization
  auth: {
    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      algorithm: 'HS256',
    },

    // Password Policy
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90, // days
    },

    // Session Management
    session: {
      maxConcurrentSessions: 3,
      sessionTimeout: 3600, // 1 hour
      rememberMeDuration: 604800, // 7 days
    },

    // MFA Configuration
    mfa: {
      enabled: true,
      required: true,
      methods: ['authenticator', 'sms'],
      backupCodes: {
        count: 10,
        length: 16,
      },
    },
  },

  // API Security
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    },

    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    },

    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.assignmentai.com'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    },
  },

  // Data Encryption
  encryption: {
    // At Rest
    atRest: {
      algorithm: 'aes-256-gcm',
      keyRotation: 90, // days
    },

    // In Transit
    inTransit: {
      minTLSVersion: 'TLSv1.2',
      ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
      ],
    },
  },

  // File Security
  files: {
    upload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
      ],
      scanForMalware: true,
    },

    storage: {
      encryption: true,
      accessControl: 'private',
      versioning: true,
    },
  },

  // Audit Logging
  audit: {
    enabled: true,
    level: 'info',
    format: 'json',
    fields: ['timestamp', 'user', 'action', 'resource', 'ip', 'userAgent', 'status'],
    retention: 365, // days
  },

  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },

  // Security Monitoring
  monitoring: {
    // Failed Login Attempts
    failedLogins: {
      maxAttempts: 5,
      windowMinutes: 15,
      lockoutDuration: 30, // minutes
    },

    // Suspicious Activity
    suspiciousActivity: {
      enabled: true,
      thresholds: {
        failedAuth: 10,
        unusualIP: 5,
        dataAccess: 100,
      },
    },

    // Alert Configuration
    alerts: {
      email: process.env.SECURITY_ALERT_EMAIL,
      slack: process.env.SECURITY_ALERT_SLACK_WEBHOOK,
    },
  },

  // Compliance
  compliance: {
    gdpr: {
      enabled: true,
      dataRetention: 365, // days
      rightToErasure: true,
      dataPortability: true,
    },

    hipaa: {
      enabled: false,
      phi: false,
    },

    pci: {
      enabled: false,
      level: 'none',
    },
  },
};
