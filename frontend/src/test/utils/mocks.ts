import { createElement } from 'react';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock WebSocket
class WebSocketMock {
  static OPEN = 1;
  static CLOSED = 3;
  readyState = WebSocketMock.OPEN;
  send = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

Object.defineProperty(window, 'WebSocket', {
  value: WebSocketMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  value: ResizeObserverMock,
});

// Mock Notification API
const NotificationMock = {
  requestPermission: vi.fn(),
  permission: 'granted',
};

Object.defineProperty(window, 'Notification', {
  value: NotificationMock,
});

// Mock Service Worker
const ServiceWorkerMock = {
  register: vi.fn(),
};

// Initialize serviceWorker on navigator if it doesn't exist
if (!navigator.serviceWorker) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: ServiceWorkerMock.register,
    },
    writable: true,
  });
} else {
  Object.defineProperty(navigator.serviceWorker, 'register', {
    value: ServiceWorkerMock.register,
  });
}

// Mock IndexedDB
const IndexedDBMock = {
  open: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: IndexedDBMock,
});

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn(),
    subtle: {
      digest: vi.fn(),
    },
  },
});

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn(callback => setTimeout(callback, 0)),
});

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

Object.defineProperty(window, 'console', {
  value: consoleMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
});

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost',
    pathname: '/',
    search: '',
    hash: '',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    protocol: 'http:',
    origin: 'http://localhost',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

// Mock history
Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  },
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test',
    language: 'en-US',
    platform: 'test',
    onLine: true,
    geolocation: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    mediaDevices: {
      getUserMedia: vi.fn(),
    },
  },
});

// Mock Material-UI components
export const mockMuiComponents = {
  Box: (props: any) => createElement('div', props, props.children),
  Alert: (props: any) =>
    createElement(
      'div',
      { ...props, role: 'alert', 'data-severity': props.severity },
      props.children
    ),
  Button: (props: any) =>
    createElement(
      'button',
      { ...props, onClick: props.onClick, disabled: props.disabled },
      props.children
    ),
  IconButton: (props: any) =>
    createElement(
      'button',
      { ...props, onClick: props.onClick, disabled: props.disabled },
      props.children
    ),
  LinearProgress: (props: any) => createElement('div', { ...props, role: 'progressbar' }),
  Paper: (props: any) => createElement('div', props, props.children),
  Typography: (props: any) => {
    const Component = props.variant === 'h6' ? 'h2' : 'p';
    return createElement(Component, props, props.children);
  },
};

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'student',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockAssignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  dueDate: '2024-12-31T23:59:59Z',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockSubmission = {
  id: '1',
  assignmentId: '1',
  userId: '1',
  content: 'Test Submission',
  status: 'submitted',
  grade: null,
  feedback: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockRubric = {
  id: '1',
  name: 'Test Rubric',
  description: 'Test Description',
  criteria: [
    {
      id: '1',
      name: 'Test Criterion',
      description: 'Test Description',
      weight: 1,
      maxScore: 10,
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockError = {
  message: 'Test error message',
  status: 400,
  data: {
    detail: 'Test error detail',
  },
};
