// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
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
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock WebSocket
class WebSocketMock {
  static OPEN = 1;
  static CLOSED = 3;
  readyState = WebSocketMock.OPEN;
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

Object.defineProperty(window, "WebSocket", {
  value: WebSocketMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
});

// Mock Notification API
const NotificationMock = {
  requestPermission: jest.fn(),
  permission: "granted",
};

Object.defineProperty(window, "Notification", {
  value: NotificationMock,
});

// Mock Service Worker
const ServiceWorkerMock = {
  register: jest.fn(),
};

Object.defineProperty(navigator.serviceWorker, "register", {
  value: ServiceWorkerMock.register,
});

// Mock IndexedDB
const IndexedDBMock = {
  open: jest.fn(),
};

Object.defineProperty(window, "indexedDB", {
  value: IndexedDBMock,
});

// Mock crypto
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: jest.fn(),
    subtle: {
      digest: jest.fn(),
    },
  },
});

// Mock performance
Object.defineProperty(window, "performance", {
  value: {
    now: jest.fn(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
});

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
  value: jest.fn((callback) => setTimeout(callback, 0)),
});

// Mock console methods
const consoleMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

Object.defineProperty(window, "console", {
  value: consoleMock,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
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

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
  value: jest.fn(),
});

// Mock location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost",
    pathname: "/",
    search: "",
    hash: "",
    host: "localhost",
    hostname: "localhost",
    port: "",
    protocol: "http:",
    origin: "http://localhost",
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
});

// Mock history
Object.defineProperty(window, "history", {
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  },
});

// Mock navigator
Object.defineProperty(window, "navigator", {
  value: {
    userAgent: "test",
    language: "en-US",
    platform: "test",
    onLine: true,
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
    mediaDevices: {
      getUserMedia: jest.fn(),
    },
  },
});
