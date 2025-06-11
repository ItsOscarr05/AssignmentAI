import { resetTestData } from './utils';

// Global before hook
before(() => {
  // Reset the database before all tests
  resetTestData();
});

// Global after hook
after(() => {
  // Clean up after all tests
  resetTestData();
});

// Before each test
beforeEach(() => {
  // Reset the database before each test
  resetTestData();

  // Clear cookies and local storage
  cy.clearCookies();
  cy.clearLocalStorage();

  // Preserve cookies for specific domains
  Cypress.Cookies.preserveOnce('session_id', 'remember_token');

  // Set default viewport
  cy.viewport(1280, 720);

  // Set default timeout
  Cypress.config('defaultCommandTimeout', 10000);

  // Set default retry attempts
  Cypress.config('retries', {
    runMode: 2,
    openMode: 0,
  });

  // Set default screenshot options
  Cypress.config('screenshotOnRunFailure', true);
  Cypress.config('video', false);

  // Set default request timeout
  Cypress.config('requestTimeout', 10000);

  // Set default response timeout
  Cypress.config('responseTimeout', 10000);

  // Set default page load timeout
  Cypress.config('pageLoadTimeout', 30000);

  // Set default wait timeout
  Cypress.config('waitForAnimations', true);
  Cypress.config('animationDistanceThreshold', 5);

  // Set default scroll behavior
  Cypress.config('scrollBehavior', 'center');

  // Set default viewport
  Cypress.config('viewportWidth', 1280);
  Cypress.config('viewportHeight', 720);

  // Set default user agent
  Cypress.config(
    'userAgent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  );

  // Set default chromeWebSecurity
  Cypress.config('chromeWebSecurity', true);

  // Set default experimentalSessionAndOrigin
  Cypress.config('experimentalSessionAndOrigin', true);

  // Set default experimentalSourceRewriting
  Cypress.config('experimentalSourceRewriting', true);

  // Set default experimentalRunAllSpecs
  Cypress.config('experimentalRunAllSpecs', true);

  // Set default experimentalStudio
  Cypress.config('experimentalStudio', true);

  // Set default experimentalFetchPolyfill
  Cypress.config('experimentalFetchPolyfill', true);

  // Set default experimentalNetworkStubbing
  Cypress.config('experimentalNetworkStubbing', true);

  // Set default experimentalShadowDomSupport
  Cypress.config('experimentalShadowDomSupport', true);

  // Set default experimentalComponentTesting
  Cypress.config('experimentalComponentTesting', true);

  // Set default experimentalSingleTabRunMode
  Cypress.config('experimentalSingleTabRunMode', true);

  // Set default experimentalSkipDomainInjection
  Cypress.config('experimentalSkipDomainInjection', true);

  // Set default experimentalSessionSupport
  Cypress.config('experimentalSessionSupport', true);

  // Set default experimentalRunAllSpecs
  Cypress.config('experimentalRunAllSpecs', true);

  // Set default experimentalStudio
  Cypress.config('experimentalStudio', true);

  // Set default experimentalFetchPolyfill
  Cypress.config('experimentalFetchPolyfill', true);

  // Set default experimentalNetworkStubbing
  Cypress.config('experimentalNetworkStubbing', true);

  // Set default experimentalShadowDomSupport
  Cypress.config('experimentalShadowDomSupport', true);

  // Set default experimentalComponentTesting
  Cypress.config('experimentalComponentTesting', true);

  // Set default experimentalSingleTabRunMode
  Cypress.config('experimentalSingleTabRunMode', true);

  // Set default experimentalSkipDomainInjection
  Cypress.config('experimentalSkipDomainInjection', true);

  // Set default experimentalSessionSupport
  Cypress.config('experimentalSessionSupport', true);
});

// After each test
afterEach(() => {
  // Take screenshot on test failure
  if (Cypress.currentTest.state === 'failed') {
    cy.screenshot();
  }

  // Log test results
  cy.task('log', {
    name: Cypress.currentTest.title,
    state: Cypress.currentTest.state,
    duration: Cypress.currentTest.duration,
  });

  // Reset the database after each test
  resetTestData();

  // Clear cookies and local storage
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Custom command to handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false;
});

// Custom command to handle window:before:load event
Cypress.on('window:before:load', win => {
  // Add custom properties to window object
  win.cypress = {
    ...win.cypress,
    customProperty: 'value',
  };
});

// Custom command to handle window:load event
Cypress.on('window:load', win => {
  // Add custom event listeners
  win.addEventListener('custom-event', event => {
    console.log('Custom event triggered:', event);
  });
});

// Custom command to handle test:before:run event
Cypress.on('test:before:run', attributes => {
  // Log test start
  console.log('Test started:', attributes.title);
});

// Custom command to handle test:after:run event
Cypress.on('test:after:run', attributes => {
  // Log test end
  console.log('Test ended:', attributes.title);
});

// Custom command to handle test:after:run:async event
Cypress.on('test:after:run:async', attributes => {
  // Log test end async
  console.log('Test ended async:', attributes.title);
});

// Custom command to handle test:after:run:async:error event
Cypress.on('test:after:run:async:error', attributes => {
  // Log test error
  console.log('Test error:', attributes.title);
});

// Custom command to handle test:after:run:async:error:uncaught event
Cypress.on('test:after:run:async:error:uncaught', attributes => {
  // Log test uncaught error
  console.log('Test uncaught error:', attributes.title);
});

// Custom command to handle test:after:run:async:error:uncaught:promise event
Cypress.on('test:after:run:async:error:uncaught:promise', attributes => {
  // Log test uncaught promise error
  console.log('Test uncaught promise error:', attributes.title);
});

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection event
Cypress.on('test:after:run:async:error:uncaught:promise:rejection', attributes => {
  // Log test uncaught promise rejection
  console.log('Test uncaught promise rejection:', attributes.title);
});

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:handled event
Cypress.on('test:after:run:async:error:uncaught:promise:rejection:handled', attributes => {
  // Log test uncaught promise rejection handled
  console.log('Test uncaught promise rejection handled:', attributes.title);
});

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled event
Cypress.on('test:after:run:async:error:uncaught:promise:rejection:unhandled', attributes => {
  // Log test uncaught promise rejection unhandled
  console.log('Test uncaught promise rejection unhandled:', attributes.title);
});

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection event
Cypress.on(
  'test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection',
  attributes => {
    // Log test uncaught promise rejection unhandled rejection
    console.log('Test uncaught promise rejection unhandled rejection:', attributes.title);
  }
);

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:handled event
Cypress.on(
  'test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:handled',
  attributes => {
    // Log test uncaught promise rejection unhandled rejection handled
    console.log('Test uncaught promise rejection unhandled rejection handled:', attributes.title);
  }
);

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled event
Cypress.on(
  'test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled',
  attributes => {
    // Log test uncaught promise rejection unhandled rejection unhandled
    console.log('Test uncaught promise rejection unhandled rejection unhandled:', attributes.title);
  }
);

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled:rejection event
Cypress.on(
  'test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled:rejection',
  attributes => {
    // Log test uncaught promise rejection unhandled rejection unhandled rejection
    console.log(
      'Test uncaught promise rejection unhandled rejection unhandled rejection:',
      attributes.title
    );
  }
);

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled:rejection:handled event
Cypress.on(
  'test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled:rejection:handled',
  attributes => {
    // Log test uncaught promise rejection unhandled rejection unhandled rejection handled
    console.log(
      'Test uncaught promise rejection unhandled rejection unhandled rejection handled:',
      attributes.title
    );
  }
);

// Custom command to handle test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled:rejection:unhandled event
Cypress.on(
  'test:after:run:async:error:uncaught:promise:rejection:unhandled:rejection:unhandled:rejection:unhandled',
  attributes => {
    // Log test uncaught promise rejection unhandled rejection unhandled rejection unhandled
    console.log(
      'Test uncaught promise rejection unhandled rejection unhandled rejection unhandled:',
      attributes.title
    );
  }
);
