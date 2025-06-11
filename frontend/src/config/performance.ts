import { PerformanceConfig } from '../types';

export const performanceConfig: PerformanceConfig = {
  // Code splitting
  codeSplitting: {
    chunks: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: -20,
      },
    },
    maxSize: 244000,
  },

  // Bundle optimization
  bundleOptimization: {
    minify: true,
    compress: true,
    treeShake: true,
    removeConsole: true,
  },

  // Service worker
  serviceWorker: {
    enabled: true,
    precache: [
      '/',
      '/index.html',
      '/static/js/main.chunk.js',
      '/static/js/0.chunk.js',
      '/static/js/bundle.js',
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.assignmentai\.com/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },

  // React optimization
  react: {
    memoization: true,
    lazyLoading: true,
    suspense: true,
    concurrentMode: true,
  },

  // Database optimization
  database: {
    indexing: {
      assignments: ['title', 'status', 'due_date'],
      submissions: ['assignment_id', 'user_id', 'status'],
      users: ['email', 'role'],
    },
    queryOptimization: {
      maxResults: 100,
      defaultLimit: 20,
    },
  },

  // Monitoring
  monitoring: {
    enabled: true,
    samplingRate: 0.1,
    metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB'],
  },

  // Lazy loading
  lazyLoading: {
    defaultTimeout: 3000,
    fallback: {
      loading: 'Loading...',
      error: 'Error loading component',
    },
  },

  // Caching
  caching: {
    staticAssets: {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      immutable: true,
    },
    apiResponses: {
      maxAge: 5 * 60, // 5 minutes
      staleWhileRevalidate: 60, // 1 minute
    },
  },

  // Image optimization
  imageOptimization: {
    formats: ['webp', 'avif'],
    quality: 80,
    maxWidth: 1920,
    lazyLoad: true,
  },
};
