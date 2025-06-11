import { defineConfig } from 'cypress';

export default defineConfig({
  // Base URL for the application
  baseUrl: 'http://localhost:3000',

  // API URL for the backend
  env: {
    apiUrl: 'http://localhost:8000',
  },

  // Test files pattern
  specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

  // Support file
  supportFile: 'cypress/support/e2e.ts',

  // Screenshot settings
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  trashAssetsBeforeRuns: true,

  // Video settings
  video: false,
  videoCompression: 32,
  videosFolder: 'cypress/videos',

  // Viewport settings
  viewportWidth: 1280,
  viewportHeight: 720,

  // Timeout settings
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  pageLoadTimeout: 30000,

  // Retry settings
  retries: {
    runMode: 2,
    openMode: 0,
  },

  // Animation settings
  waitForAnimations: true,
  animationDistanceThreshold: 5,

  // Scroll behavior
  scrollBehavior: 'center',

  // User agent
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',

  // Security settings
  chromeWebSecurity: true,

  // Experimental features
  experimentalSessionAndOrigin: true,
  experimentalSourceRewriting: true,
  experimentalRunAllSpecs: true,
  experimentalStudio: true,
  experimentalFetchPolyfill: true,
  experimentalNetworkStubbing: true,
  experimentalShadowDomSupport: true,
  experimentalComponentTesting: true,
  experimentalSingleTabRunMode: true,
  experimentalSkipDomainInjection: true,
  experimentalSessionSupport: true,

  // Reporter settings
  reporter: 'spec',
  reporterOptions: {
    mochaFile: 'cypress/results/results-[hash].xml',
    toConsole: true,
  },

  // Task settings
  taskTimeout: 60000,

  // File settings
  fileServerFolder: 'cypress',
  fixturesFolder: 'cypress/fixtures',
  downloadsFolder: 'cypress/downloads',

  // Node version
  nodeVersion: 'system',

  // TypeScript settings
  typescript: {
    compilerOptions: {
      target: 'es5',
      lib: ['es5', 'dom'],
      types: ['cypress', 'node'],
    },
  },

  // Browser settings
  browsers: [
    {
      name: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
      version: '91.0.4472.124',
      path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      majorVersion: 91,
    },
    {
      name: 'firefox',
      family: 'firefox',
      channel: 'stable',
      displayName: 'Firefox',
      version: '89.0',
      path: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      majorVersion: 89,
    },
    {
      name: 'edge',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Edge',
      version: '91.0.864.59',
      path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      majorVersion: 91,
    },
  ],

  // Default browser
  defaultBrowser: 'chrome',

  // Browser launch options
  browserLaunchOptions: {
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  },

  // Proxy settings
  proxyUrl: 'http://localhost:8080',

  // SSL settings
  ssl: {
    key: 'cypress/ssl/key.pem',
    cert: 'cypress/ssl/cert.pem',
  },

  // Cookie settings
  cookies: {
    preserve: ['session_id', 'remember_token'],
  },

  // Local storage settings
  localStorage: {
    preserve: ['user', 'settings'],
  },

  // Session storage settings
  sessionStorage: {
    preserve: ['auth'],
  },

  // Network settings
  network: {
    enableNetworkLogging: true,
    enableRequestLogging: true,
    enableResponseLogging: true,
  },

  // Performance settings
  performance: {
    enablePerformanceLogging: true,
    enableResourceTiming: true,
    enableNavigationTiming: true,
  },

  // Accessibility settings
  accessibility: {
    enableAccessibilityLogging: true,
    enableAxeCore: true,
  },

  // Coverage settings
  coverage: {
    enableCoverage: true,
    coverageFolder: 'cypress/coverage',
    coverageReportFolder: 'cypress/coverage/report',
  },

  // Test isolation
  testIsolation: true,

  // Parallelization settings
  parallel: {
    enabled: true,
    workers: 4,
  },

  // CI settings
  ci: {
    enabled: true,
    provider: 'github',
    buildId:
      process.env.CIRCLE_BUILD_NUM || process.env.TRAVIS_BUILD_NUMBER || process.env.BUILD_NUMBER,
    commitSha: process.env.CIRCLE_SHA1 || process.env.TRAVIS_COMMIT || process.env.COMMIT_SHA,
  },

  // Artifact settings
  artifacts: {
    enabled: true,
    folder: 'cypress/artifacts',
  },

  // Cache settings
  cache: {
    enabled: true,
    folder: 'cypress/cache',
  },

  // Log settings
  log: {
    enabled: true,
    level: 'info',
    folder: 'cypress/logs',
  },

  // Debug settings
  debug: {
    enabled: false,
    level: 'debug',
    folder: 'cypress/debug',
  },

  // Error settings
  error: {
    enabled: true,
    level: 'error',
    folder: 'cypress/errors',
  },

  // Warning settings
  warning: {
    enabled: true,
    level: 'warn',
    folder: 'cypress/warnings',
  },

  // Info settings
  info: {
    enabled: true,
    level: 'info',
    folder: 'cypress/info',
  },

  // Verbose settings
  verbose: {
    enabled: false,
    level: 'verbose',
    folder: 'cypress/verbose',
  },

  // Silent settings
  silent: {
    enabled: false,
    level: 'silent',
    folder: 'cypress/silent',
  },

  // Trace settings
  trace: {
    enabled: true,
    level: 'trace',
    folder: 'cypress/traces',
  },

  // Profile settings
  profile: {
    enabled: true,
    level: 'profile',
    folder: 'cypress/profiles',
  },

  // Memory settings
  memory: {
    enabled: true,
    level: 'memory',
    folder: 'cypress/memory',
  },

  // CPU settings
  cpu: {
    enabled: true,
    level: 'cpu',
    folder: 'cypress/cpu',
  },

  // Heap settings
  heap: {
    enabled: true,
    level: 'heap',
    folder: 'cypress/heap',
  },

  // Garbage collection settings
  gc: {
    enabled: true,
    level: 'gc',
    folder: 'cypress/gc',
  },

  // Network throttling settings
  networkThrottling: {
    enabled: true,
    downloadThroughput: 1024 * 1024, // 1 MB/s
    uploadThroughput: 1024 * 1024, // 1 MB/s
    latency: 20, // 20ms
  },

  // CPU throttling settings
  cpuThrottling: {
    enabled: true,
    rate: 4, // 4x slower
  },

  // Memory throttling settings
  memoryThrottling: {
    enabled: true,
    rate: 4, // 4x slower
  },

  // Disk throttling settings
  diskThrottling: {
    enabled: true,
    rate: 4, // 4x slower
  },

  // Network conditions
  networkConditions: {
    enabled: true,
    conditions: [
      {
        name: 'GPRS',
        downloadThroughput: 50 * 1024, // 50 KB/s
        uploadThroughput: 20 * 1024, // 20 KB/s
        latency: 500, // 500ms
      },
      {
        name: 'Regular 3G',
        downloadThroughput: 750 * 1024, // 750 KB/s
        uploadThroughput: 250 * 1024, // 250 KB/s
        latency: 100, // 100ms
      },
      {
        name: 'Good 3G',
        downloadThroughput: 1.5 * 1024 * 1024, // 1.5 MB/s
        uploadThroughput: 750 * 1024, // 750 KB/s
        latency: 40, // 40ms
      },
      {
        name: 'Regular 4G',
        downloadThroughput: 4 * 1024 * 1024, // 4 MB/s
        uploadThroughput: 3 * 1024 * 1024, // 3 MB/s
        latency: 20, // 20ms
      },
      {
        name: 'DSL',
        downloadThroughput: 2 * 1024 * 1024, // 2 MB/s
        uploadThroughput: 1 * 1024 * 1024, // 1 MB/s
        latency: 5, // 5ms
      },
      {
        name: 'WiFi',
        downloadThroughput: 30 * 1024 * 1024, // 30 MB/s
        uploadThroughput: 15 * 1024 * 1024, // 15 MB/s
        latency: 2, // 2ms
      },
    ],
  },

  // Device emulation
  deviceEmulation: {
    enabled: true,
    devices: [
      {
        name: 'iPhone 6',
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
      },
      {
        name: 'iPhone 6 Plus',
        width: 414,
        height: 736,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
      },
      {
        name: 'iPhone X',
        width: 375,
        height: 812,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
      },
      {
        name: 'iPad',
        width: 768,
        height: 1024,
        deviceScaleFactor: 2,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
      },
      {
        name: 'iPad Pro',
        width: 1024,
        height: 1366,
        deviceScaleFactor: 2,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
      },
      {
        name: 'Nexus 5',
        width: 360,
        height: 640,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36',
      },
      {
        name: 'Nexus 6P',
        width: 412,
        height: 732,
        deviceScaleFactor: 3.5,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 6.0; Nexus 6P Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36',
      },
      {
        name: 'Pixel 2',
        width: 411,
        height: 731,
        deviceScaleFactor: 2.625,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Mobile Safari/537.36',
      },
      {
        name: 'Pixel 2 XL',
        width: 411,
        height: 823,
        deviceScaleFactor: 3.5,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 XL Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.109 Mobile Safari/537.36',
      },
      {
        name: 'Galaxy S5',
        width: 360,
        height: 640,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36',
      },
      {
        name: 'Galaxy S8',
        width: 360,
        height: 740,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 7.0; SM-G950U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36',
      },
      {
        name: 'Galaxy S9+',
        width: 412,
        height: 846,
        deviceScaleFactor: 3.5,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 8.0.0; SM-G965U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.111 Mobile Safari/537.36',
      },
      {
        name: 'Galaxy Tab S4',
        width: 712,
        height: 1138,
        deviceScaleFactor: 2.25,
        mobile: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 8.1.0; SM-T835) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.126 Safari/537.36',
      },
      {
        name: 'Surface Pro',
        width: 912,
        height: 1368,
        deviceScaleFactor: 2,
        mobile: false,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      },
      {
        name: 'Surface Book',
        width: 1500,
        height: 1000,
        deviceScaleFactor: 2,
        mobile: false,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      },
    ],
  },

  // Default device
  defaultDevice: 'iPhone 6',

  // Device rotation
  deviceRotation: {
    enabled: true,
    rotation: 0, // 0, 90, 180, 270
  },

  // Device orientation
  deviceOrientation: {
    enabled: true,
    orientation: 'portrait', // portrait, landscape
  },

  // Device pixel ratio
  devicePixelRatio: {
    enabled: true,
    ratio: 2,
  },

  // Device color scheme
  deviceColorScheme: {
    enabled: true,
    scheme: 'light', // light, dark
  },

  // Device reduced motion
  deviceReducedMotion: {
    enabled: true,
    reduced: false,
  },

  // Device reduced data
  deviceReducedData: {
    enabled: true,
    reduced: false,
  },

  // Device reduced transparency
  deviceReducedTransparency: {
    enabled: true,
    reduced: false,
  },

  // Device reduced animations
  deviceReducedAnimations: {
    enabled: true,
    reduced: false,
  },

  // Device reduced contrast
  deviceReducedContrast: {
    enabled: true,
    reduced: false,
  },

  // Device reduced color
  deviceReducedColor: {
    enabled: true,
    reduced: false,
  },

  // Device reduced media
  deviceReducedMedia: {
    enabled: true,
    reduced: false,
  },

  // Device reduced images
  deviceReducedImages: {
    enabled: true,
    reduced: false,
  },

  // Device reduced video
  deviceReducedVideo: {
    enabled: true,
    reduced: false,
  },

  // Device reduced audio
  deviceReducedAudio: {
    enabled: true,
    reduced: false,
  },

  // Device reduced notifications
  deviceReducedNotifications: {
    enabled: true,
    reduced: false,
  },

  // Device reduced haptics
  deviceReducedHaptics: {
    enabled: true,
    reduced: false,
  },

  // Device reduced vibrations
  deviceReducedVibrations: {
    enabled: true,
    reduced: false,
  },

  // Device reduced sounds
  deviceReducedSounds: {
    enabled: true,
    reduced: false,
  },

  // Device reduced alerts
  deviceReducedAlerts: {
    enabled: true,
    reduced: false,
  },

  // Device reduced popups
  deviceReducedPopups: {
    enabled: true,
    reduced: false,
  },

  // Device reduced modals
  deviceReducedModals: {
    enabled: true,
    reduced: false,
  },

  // Device reduced tooltips
  deviceReducedTooltips: {
    enabled: true,
    reduced: false,
  },

  // Device reduced overlays
  deviceReducedOverlays: {
    enabled: true,
    reduced: false,
  },

  // Device reduced shadows
  deviceReducedShadows: {
    enabled: true,
    reduced: false,
  },

  // Device reduced borders
  deviceReducedBorders: {
    enabled: true,
    reduced: false,
  },

  // Device reduced outlines
  deviceReducedOutlines: {
    enabled: true,
    reduced: false,
  },

  // Device reduced focus rings
  deviceReducedFocusRings: {
    enabled: true,
    reduced: false,
  },

  // Device reduced scrollbars
  deviceReducedScrollbars: {
    enabled: true,
    reduced: false,
  },

  // Device reduced cursors
  deviceReducedCursors: {
    enabled: true,
    reduced: false,
  },

  // Device reduced selection
  deviceReducedSelection: {
    enabled: true,
    reduced: false,
  },

  // Device reduced drag
  deviceReducedDrag: {
    enabled: true,
    reduced: false,
  },

  // Device reduced drop
  deviceReducedDrop: {
    enabled: true,
    reduced: false,
  },

  // Device reduced hover
  deviceReducedHover: {
    enabled: true,
    reduced: false,
  },

  // Device reduced active
  deviceReducedActive: {
    enabled: true,
    reduced: false,
  },

  // Device reduced focus
  deviceReducedFocus: {
    enabled: true,
    reduced: false,
  },

  // Device reduced visited
  deviceReducedVisited: {
    enabled: true,
    reduced: false,
  },

  // Device reduced link
  deviceReducedLink: {
    enabled: true,
    reduced: false,
  },

  // Device reduced button
  deviceReducedButton: {
    enabled: true,
    reduced: false,
  },

  // Device reduced input
  deviceReducedInput: {
    enabled: true,
    reduced: false,
  },

  // Device reduced select
  deviceReducedSelect: {
    enabled: true,
    reduced: false,
  },

  // Device reduced textarea
  deviceReducedTextarea: {
    enabled: true,
    reduced: false,
  },

  // Device reduced checkbox
  deviceReducedCheckbox: {
    enabled: true,
    reduced: false,
  },

  // Device reduced radio
  deviceReducedRadio: {
    enabled: true,
    reduced: false,
  },

  // Device reduced range
  deviceReducedRange: {
    enabled: true,
    reduced: false,
  },

  // Device reduced file
  deviceReducedFile: {
    enabled: true,
    reduced: false,
  },

  // Device reduced submit
  deviceReducedSubmit: {
    enabled: true,
    reduced: false,
  },

  // Device reduced reset
  deviceReducedReset: {
    enabled: true,
    reduced: false,
  },

  // Device reduced image
  deviceReducedImage: {
    enabled: true,
    reduced: false,
  },

  // Device reduced video
  deviceReducedVideo: {
    enabled: true,
    reduced: false,
  },

  // Device reduced audio
  deviceReducedAudio: {
    enabled: true,
    reduced: false,
  },

  // Device reduced canvas
  deviceReducedCanvas: {
    enabled: true,
    reduced: false,
  },

  // Device reduced svg
  deviceReducedSvg: {
    enabled: true,
    reduced: false,
  },

  // Device reduced mathml
  deviceReducedMathml: {
    enabled: true,
    reduced: false,
  },

  // Device reduced object
  deviceReducedObject: {
    enabled: true,
    reduced: false,
  },

  // Device reduced embed
  deviceReducedEmbed: {
    enabled: true,
    reduced: false,
  },

  // Device reduced iframe
  deviceReducedIframe: {
    enabled: true,
    reduced: false,
  },

  // Device reduced frame
  deviceReducedFrame: {
    enabled: true,
    reduced: false,
  },

  // Device reduced frameset
  deviceReducedFrameset: {
    enabled: true,
    reduced: false,
  },

  // Device reduced noframes
  deviceReducedNoframes: {
    enabled: true,
    reduced: false,
  },

  // Device reduced applet
  deviceReducedApplet: {
    enabled: true,
    reduced: false,
  },

  // Device reduced param
  deviceReducedParam: {
    enabled: true,
    reduced: false,
  },

  // Device reduced source
  deviceReducedSource: {
    enabled: true,
    reduced: false,
  },

  // Device reduced track
  deviceReducedTrack: {
    enabled: true,
    reduced: false,
  },

  // Device reduced map
  deviceReducedMap: {
    enabled: true,
    reduced: false,
  },

  // Device reduced area
  deviceReducedArea: {
    enabled: true,
    reduced: false,
  },

  // Device reduced table
  deviceReducedTable: {
    enabled: true,
    reduced: false,
  },

  // Device reduced caption
  deviceReducedCaption: {
    enabled: true,
    reduced: false,
  },

  // Device reduced colgroup
  deviceReducedColgroup: {
    enabled: true,
    reduced: false,
  },

  // Device reduced col
  deviceReducedCol: {
    enabled: true,
    reduced: false,
  },

  // Device reduced thead
  deviceReducedThead: {
    enabled: true,
    reduced: false,
  },

  // Device reduced tbody
  deviceReducedTbody: {
    enabled: true,
    reduced: false,
  },

  // Device reduced tfoot
  deviceReducedTfoot: {
    enabled: true,
    reduced: false,
  },

  // Device reduced tr
  deviceReducedTr: {
    enabled: true,
    reduced: false,
  },

  // Device reduced th
  deviceReducedTh: {
    enabled: true,
    reduced: false,
  },

  // Device reduced td
  deviceReducedTd: {
    enabled: true,
    reduced: false,
  },

  // Device reduced form
  deviceReducedForm: {
    enabled: true,
    reduced: false,
  },

  // Device reduced fieldset
  deviceReducedFieldset: {
    enabled: true,
    reduced: false,
  },

  // Device reduced legend
  deviceReducedLegend: {
    enabled: true,
    reduced: false,
  },

  // Device reduced label
  deviceReducedLabel: {
    enabled: true,
    reduced: false,
  },

  // Device reduced output
  deviceReducedOutput: {
    enabled: true,
    reduced: false,
  },

  // Device reduced progress
  deviceReducedProgress: {
    enabled: true,
    reduced: false,
  },

  // Device reduced meter
  deviceReducedMeter: {
    enabled: true,
    reduced: false,
  },

  // Device reduced details
  deviceReducedDetails: {
    enabled: true,
    reduced: false,
  },

  // Device reduced summary
  deviceReducedSummary: {
    enabled: true,
    reduced: false,
  },

  // Device reduced menu
  deviceReducedMenu: {
    enabled: true,
    reduced: false,
  },

  // Device reduced menuitem
  deviceReducedMenuitem: {
    enabled: true,
    reduced: false,
  },

  // Device reduced dialog
  deviceReducedDialog: {
    enabled: true,
    reduced: false,
  },

  // Device reduced datalist
  deviceReducedDatalist: {
    enabled: true,
    reduced: false,
  },

  // Device reduced keygen
  deviceReducedKeygen: {
    enabled: true,
    reduced: false,
  },

  // Device reduced output
  deviceReducedOutput: {
    enabled: true,
    reduced: false,
  },

  // Device reduced progress
  deviceReducedProgress: {
    enabled: true,
    reduced: false,
  },

  // Device reduced meter
  deviceReducedMeter: {
    enabled: true,
    reduced: false,
  },

  // Device reduced details
  deviceReducedDetails: {
    enabled: true,
    reduced: false,
  },

  // Device reduced summary
  deviceReducedSummary: {
    enabled: true,
    reduced: false,
  },

  // Device reduced menu
  deviceReducedMenu: {
    enabled: true,
    reduced: false,
  },

  // Device reduced menuitem
  deviceReducedMenuitem: {
    enabled: true,
    reduced: false,
  },

  // Device reduced dialog
  deviceReducedDialog: {
    enabled: true,
    reduced: false,
  },

  // Device reduced datalist
  deviceReducedDatalist: {
    enabled: true,
    reduced: false,
  },

  // Device reduced keygen
  deviceReducedKeygen: {
    enabled: true,
    reduced: false,
  },
});
