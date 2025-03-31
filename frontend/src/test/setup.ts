import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
import { server } from "./mocks/server";

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
class WebSocket {
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

Object.defineProperty(window, "WebSocket", {
  value: WebSocket,
});

// Mock Notification API
Object.defineProperty(window, "Notification", {
  value: {
    requestPermission: jest.fn(),
    permission: "default",
  },
});

// Mock Service Worker
Object.defineProperty(window, "serviceWorker", {
  value: {
    register: jest.fn(),
  },
});

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, "indexedDB", {
  value: indexedDB,
});

// Mock crypto
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: jest.fn(),
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
});

// Mock performance
Object.defineProperty(window, "performance", {
  value: {
    now: jest.fn(),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(),
    getEntriesByName: jest.fn(),
  },
});

// Mock requestAnimationFrame
window.requestAnimationFrame = jest.fn();
window.cancelAnimationFrame = jest.fn();

// Mock console methods
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Start MSW server before all tests
beforeAll(() => server.listen());

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Clean up after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});
