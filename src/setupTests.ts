import '@testing-library/cypress';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill for TextEncoder/TextDecoder
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: cy.stub().returns({
    matches: false,
    media: '',
    onchange: null,
    addListener: cy.stub(),
    removeListener: cy.stub(),
    addEventListener: cy.stub(),
    removeEventListener: cy.stub(),
    dispatchEvent: cy.stub(),
  }),
});

// Mock IntersectionObserver
class IntersectionObserver {
  observe = cy.stub();
  disconnect = cy.stub();
  unobserve = cy.stub();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock ResizeObserver
class ResizeObserver {
  observe = cy.stub();
  disconnect = cy.stub();
  unobserve = cy.stub();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock localStorage
const localStorageMock = {
  getItem: cy.stub(),
  setItem: cy.stub(),
  removeItem: cy.stub(),
  clear: cy.stub(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: cy.stub(),
  setItem: cy.stub(),
  removeItem: cy.stub(),
  clear: cy.stub(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = cy.stub();

// Reset all mocks before each test
beforeEach(() => {
  cy.window().then(win => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});
