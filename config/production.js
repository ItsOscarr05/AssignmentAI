module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.FRONTEND_URL || 'https://assignmentai.com',
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
    },
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    cloudfront: {
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      domain: process.env.CLOUDFRONT_DOMAIN,
    },
  },

  // Redis Configuration (for caching and session management)
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    ttl: 24 * 60 * 60, // 24 hours
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 12,
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.assignmentai.com'],
        },
      },
    },
  },

  // Logging Configuration
  logging: {
    level: 'info',
    format: 'json',
    transports: [
      {
        type: 'file',
        filename: 'logs/error.log',
        level: 'error',
      },
      {
        type: 'file',
        filename: 'logs/combined.log',
      },
    ],
  },

  // Monitoring Configuration
  monitoring: {
    prometheus: {
      enabled: true,
      path: '/metrics',
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: 'AssignmentAI',
    },
  },

  // Email Configuration
  email: {
    provider: 'smtp',
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: 'noreply@assignmentai.com',
  },

  // Cache Configuration
  cache: {
    ttl: 3600, // 1 hour
    checkPeriod: 600, // 10 minutes
    max: 1000, // maximum number of items in cache
  },

  // Load Balancer Configuration
  loadBalancer: {
    enabled: true,
    healthCheck: {
      path: '/health',
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      unhealthyThreshold: 2,
      healthyThreshold: 3,
    },
  },

  // Auto-scaling Configuration
  autoScaling: {
    enabled: true,
    minInstances: 2,
    maxInstances: 10,
    targetCPUUtilization: 70,
    targetMemoryUtilization: 80,
    cooldownPeriod: 300, // 5 minutes
  },

  // Backup Configuration
  backup: {
    schedule: '0 0 * * *', // Daily at midnight
    retention: 30, // 30 days
    storage: {
      type: 's3',
      bucket: process.env.BACKUP_BUCKET,
      path: 'backups/',
    },
  },

  // Feature Flags
  features: {
    aiAnalysis: true,

    fileUpload: true,
    analytics: true,
    maintenance: false,
  },
};
