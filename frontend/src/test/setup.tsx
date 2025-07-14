import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure, render } from '@testing-library/react';
import { createElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TextDecoder, TextEncoder } from 'util';
import { afterEach, beforeAll, expect, vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme';
import { server } from './mocks/server';

// Move all mocks and mock definitions to the very top of the file

const mockMuiComponents = {
  Box: (props: any) => createElement('div', { ...props, 'data-testid': 'mui-box' }, props.children),
  createTheme: (..._args: any[]) => ({}),
  keyframes: (strings: TemplateStringsArray, ..._values: any[]) => ({
    toString: () => strings.join(''),
  }),
  Alert: (props: any) =>
    createElement(
      'div',
      { ...props, role: 'alert', 'data-severity': props.severity },
      props.children
    ),
  Button: (props: any) => {
    const classes = [
      'MuiButton-root',
      props.color && `MuiButton-color${props.color.charAt(0).toUpperCase() + props.color.slice(1)}`,
      props.variant && `MuiButton-${props.variant}`,
      props.size && `MuiButton-size${props.size.charAt(0).toUpperCase() + props.size.slice(1)}`,
      props.className,
    ]
      .filter(Boolean)
      .join(' ');

    return createElement(
      'button',
      {
        ...props,
        className: classes,
        onClick: props.onClick,
        disabled: props.disabled,
        style: props.style,
      },
      props.children
    );
  },
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
    return createElement(
      Component,
      {
        ...props,
        'data-testid': props['data-testid'],
        color: props.color,
        variant: props.variant,
      },
      props.children
    );
  },
  Snackbar: (props: any) =>
    createElement('div', { ...props, role: 'alert', 'data-testid': 'snackbar' }, props.children),
  Dialog: (props: any) => {
    const {
      onClose,
      role = 'dialog',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      tabIndex,
      'data-testid': dataTestId = 'dialog',
      className,
      style,
      dialogClassName,
      dialogStyle,
      children,
    } = props;

    const classes = ['MuiDialog-root', dialogClassName, className].filter(Boolean).join(' ');

    const styles = {
      ...dialogStyle,
      ...style,
    };

    const handleClick = (e: any) => {
      if (e.target === e.currentTarget && onClose) {
        onClose(e, 'backdropClick');
      }
    };

    const handleKeyDown = (e: any) => {
      if (e.key === 'Escape' && onClose) {
        onClose(e, 'escapeKeyDown');
      }
    };

    const elementProps = {
      role,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      tabIndex,
      'data-testid': dataTestId,
      className: classes,
      style: styles,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    };

    return createElement('div', elementProps, children);
  },
  DialogTitle: (props: any) =>
    createElement('h2', { ...props, 'data-testid': 'dialog-title' }, props.children),
  DialogContent: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'dialog-content' }, props.children),
  DialogContentText: (props: any) =>
    createElement('p', { ...props, 'data-testid': 'dialog-content-text' }, props.children),
  DialogActions: (props: any) =>
    createElement(
      'div',
      { ...props, 'data-testid': 'dialog-actions', role: 'group' },
      props.children
    ),
  TextField: (props: any) => {
    const inputProps = {
      ...props,
      type: props.type || 'text',
      'data-testid': props['data-testid'] || 'text-field',
      value: props.value,
    };

    return createElement('div', null, [
      createElement('input', inputProps),
      props.error &&
        props.helperText &&
        createElement('p', { 'data-testid': `${props['data-testid']}-error` }, props.helperText),
    ]);
  },
  Select: (props: any) =>
    createElement(
      'select',
      { ...props, 'data-testid': props['data-testid'] || 'select' },
      props.children
    ),
  MenuItem: (props: any) =>
    createElement('option', { ...props, 'data-testid': 'menu-item' }, props.children),
  CircularProgress: (props: any) =>
    createElement('div', { ...props, role: 'progressbar', 'data-testid': 'circular-progress' }),
  List: (props: any) => createElement('ul', { ...props, 'data-testid': 'list' }, props.children),
  ListItem: (props: any) =>
    createElement('li', { ...props, 'data-testid': 'list-item' }, props.children),
  ListItemText: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'list-item-text' }, props.children),
  ListItemIcon: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'list-item-icon' }, props.children),
  Divider: (props: any) => createElement('hr', { ...props, 'data-testid': 'divider' }),
  Card: (props: any) => createElement('div', { ...props, 'data-testid': 'card' }, props.children),
  CardContent: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'card-content' }, props.children),
  CardActions: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'card-actions' }, props.children),
  Grid: (props: any) => createElement('div', { ...props, 'data-testid': 'grid' }, props.children),
  Container: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'container' }, props.children),
  AppBar: (props: any) =>
    createElement('header', { ...props, 'data-testid': 'app-bar' }, props.children),
  Toolbar: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'toolbar' }, props.children),
  Drawer: (props: any) =>
    createElement('nav', { ...props, 'data-testid': 'drawer' }, props.children),
  Menu: (props: any) => createElement('div', { ...props, 'data-testid': 'menu' }, props.children),
  Tooltip: (props: any) =>
    createElement(
      'div',
      { ...props, 'data-testid': 'tooltip', title: props.title },
      props.children
    ),
  Checkbox: (props: any) =>
    createElement('input', {
      ...props,
      type: 'checkbox',
      'data-testid': props['data-testid'] || 'checkbox',
    }),
  Switch: (props: any) =>
    createElement('input', {
      ...props,
      type: 'checkbox',
      'data-testid': props['data-testid'] || 'switch',
    }),
  Radio: (props: any) =>
    createElement('input', {
      ...props,
      type: 'radio',
      'data-testid': props['data-testid'] || 'radio',
    }),
  RadioGroup: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'radio-group' }, props.children),
  FormControl: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'form-control' }, props.children),
  FormControlLabel: (props: any) =>
    createElement('label', { ...props, 'data-testid': 'form-control-label' }, props.children),
  FormHelperText: (props: any) =>
    createElement('p', { ...props, 'data-testid': 'form-helper-text' }, props.children),
  InputLabel: (props: any) =>
    createElement('label', { ...props, 'data-testid': 'input-label' }, props.children),
  OutlinedInput: (props: any) =>
    createElement('input', { ...props, 'data-testid': 'outlined-input' }),
  InputAdornment: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'input-adornment' }, props.children),
  Chip: (props: any) => createElement('div', { ...props, 'data-testid': 'chip' }, props.children),
  Avatar: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'avatar' }, props.children),
  Badge: (props: any) => createElement('div', { ...props, 'data-testid': 'badge' }, props.children),
  Tabs: (props: any) => createElement('div', { ...props, 'data-testid': 'tabs' }, props.children),
  Tab: (props: any) => createElement('button', { ...props, 'data-testid': 'tab' }, props.children),
  TabPanel: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'tab-panel' }, props.children),
  Accordion: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'accordion' }, props.children),
  AccordionSummary: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'accordion-summary' }, props.children),
  AccordionDetails: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'accordion-details' }, props.children),
  Stepper: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'stepper' }, props.children),
  Step: (props: any) => createElement('div', { ...props, 'data-testid': 'step' }, props.children),
  StepLabel: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'step-label' }, props.children),
  StepContent: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'step-content' }, props.children),
  Breadcrumbs: (props: any) =>
    createElement('nav', { ...props, 'data-testid': 'breadcrumbs' }, props.children),
  Link: (props: any) => createElement('a', { ...props, 'data-testid': 'mui-link' }, props.children),
  AlertTitle: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'alert-title' }, props.children),
  Collapse: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'collapse' }, props.children),
  Fade: (props: any) => createElement('div', { ...props, 'data-testid': 'fade' }, props.children),
  Grow: (props: any) => createElement('div', { ...props, 'data-testid': 'grow' }, props.children),
  Slide: (props: any) => createElement('div', { ...props, 'data-testid': 'slide' }, props.children),
  Zoom: (props: any) => createElement('div', { ...props, 'data-testid': 'zoom' }, props.children),
  Skeleton: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'skeleton' }, props.children),
  Backdrop: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'backdrop' }, props.children),
  Modal: (props: any) => createElement('div', { ...props, 'data-testid': 'modal' }, props.children),
  Popover: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'popover' }, props.children),
  Popper: (props: any) =>
    createElement('div', { ...props, 'data-testid': 'popper' }, props.children),
  ClickAwayListener: ({ children }: any) => children,
  NoSsr: ({ children }: any) => children,
  Portal: ({ children }: any) => children,
  ScopedCssBaseline: ({ children }: any) => children,
  CssBaseline: () => null,
  StyledEngineProvider: ({ children }: any) => children,
  ThemeProvider: ({ children }: any) =>
    createElement('div', { 'data-testid': 'theme-provider' }, children),
  useTheme: () => theme,
  useMediaQuery: (_query: string) => false,
  useScrollTrigger: (_options?: any) => false,
  useAutocomplete: (_options?: any) => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    getListboxProps: () => ({}),
    getOptionProps: () => ({}),
    inputValue: '',
    value: null,
    focused: false,
    anchorEl: null,
    setAnchorEl: () => {},
    popupOpen: false,
    highlightedIndex: -1,
    selectedOptions: [],
    groupedOptions: [],
  }),
  usePagination: (_options?: any) => ({
    items: [],
    getItemAriaLabel: () => '',
  }),
  useTabPanel: (_options?: any) => ({
    hidden: false,
    id: '',
    'aria-labelledby': '',
  }),
  useTab: (_options?: any) => ({
    selected: false,
    indicator: null,
    ..._options,
  }),
  useAccordion: (_options?: any) => ({
    expanded: false,
    onChange: () => {},
  }),
};

vi.mock('@mui/material', () => ({
  ...mockMuiComponents,
  createTheme: (..._args: any[]) => ({}),
  ThemeProvider: ({ children }: any) =>
    createElement('div', { 'data-testid': 'theme-provider' }, children),
}));

// Add jest-dom matchers
expect.extend(matchers);

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 1000,
});

// Extend Vitest's expect with jest-dom matchers
declare global {
  namespace Vi {
    interface Assertion<T = any> extends jest.Matchers<void, T> {}
    interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
  }
}

// Mock Material-UI icons
const mockIcons = {
  Close: () => createElement('span', { 'data-testid': 'CloseIcon' }, 'Close'),
  Description: () => createElement('span', { 'data-testid': 'DescriptionIcon' }, 'Description'),
  Image: () => createElement('span', { 'data-testid': 'ImageIcon' }, 'Image'),
  CloudUpload: () => createElement('span', { 'data-testid': 'CloudUploadIcon' }, 'CloudUpload'),
  Download: () => createElement('span', { 'data-testid': 'DownloadIcon' }, 'Download'),
  Edit: () => createElement('span', { 'data-testid': 'EditIcon' }, 'Edit'),
  Delete: () => createElement('span', { 'data-testid': 'DeleteIcon' }, 'Delete'),
  Add: () => createElement('span', { 'data-testid': 'AddIcon' }, 'Add'),
  Search: () => createElement('span', { 'data-testid': 'SearchIcon' }, 'Search'),
  Menu: () => createElement('span', { 'data-testid': 'MenuIcon' }, 'Menu'),
  Settings: () => createElement('span', { 'data-testid': 'SettingsIcon' }, 'Settings'),
  Person: () => createElement('span', { 'data-testid': 'PersonIcon' }, 'Person'),
  Notifications: () =>
    createElement('span', { 'data-testid': 'NotificationsIcon' }, 'Notifications'),
  ArrowBack: () => createElement('span', { 'data-testid': 'ArrowBackIcon' }, 'ArrowBack'),
  ArrowForward: () => createElement('span', { 'data-testid': 'ArrowForwardIcon' }, 'ArrowForward'),
  Check: () => createElement('span', { 'data-testid': 'CheckIcon' }, 'Check'),
  Cancel: () => createElement('span', { 'data-testid': 'CancelIcon' }, 'Cancel'),
  Info: () => createElement('span', { 'data-testid': 'InfoIcon' }, 'Info'),
  Warning: () => createElement('span', { 'data-testid': 'WarningIcon' }, 'Warning'),
  Error: () => createElement('span', { 'data-testid': 'ErrorIcon' }, 'Error'),
  Success: () => createElement('span', { 'data-testid': 'SuccessIcon' }, 'Success'),
  Clear: () => createElement('span', { 'data-testid': 'ClearIcon' }, 'Clear'),
  Visibility: () => createElement('span', { 'data-testid': 'VisibilityIcon' }, 'Visibility'),
  VisibilityOff: () =>
    createElement('span', { 'data-testid': 'VisibilityOffIcon' }, 'VisibilityOff'),
  Refresh: () => createElement('span', { 'data-testid': 'RefreshIcon' }, 'Refresh'),
  FilterList: () => createElement('span', { 'data-testid': 'FilterListIcon' }, 'FilterList'),
  Sort: () => createElement('span', { 'data-testid': 'SortIcon' }, 'Sort'),
  MoreVert: () => createElement('span', { 'data-testid': 'MoreVertIcon' }, 'MoreVert'),
  ExpandMore: () => createElement('span', { 'data-testid': 'ExpandMoreIcon' }, 'ExpandMore'),
  ExpandLess: () => createElement('span', { 'data-testid': 'ExpandLessIcon' }, 'ExpandLess'),
  ChevronLeft: () => createElement('span', { 'data-testid': 'ChevronLeftIcon' }, 'ChevronLeft'),
  ChevronRight: () => createElement('span', { 'data-testid': 'ChevronRightIcon' }, 'ChevronRight'),
  Home: () => createElement('span', { 'data-testid': 'HomeIcon' }, 'Home'),
  Assignment: () => createElement('span', { 'data-testid': 'AssignmentIcon' }, 'Assignment'),
  School: () => createElement('span', { 'data-testid': 'SchoolIcon' }, 'School'),
  Group: () => createElement('span', { 'data-testid': 'GroupIcon' }, 'Group'),
  CalendarToday: () =>
    createElement('span', { 'data-testid': 'CalendarTodayIcon' }, 'CalendarToday'),
  AccessTime: () => createElement('span', { 'data-testid': 'AccessTimeIcon' }, 'AccessTime'),
  LocationOn: () => createElement('span', { 'data-testid': 'LocationOnIcon' }, 'LocationOn'),
  Email: () => createElement('span', { 'data-testid': 'EmailIcon' }, 'Email'),
  Phone: () => createElement('span', { 'data-testid': 'PhoneIcon' }, 'Phone'),
  Language: () => createElement('span', { 'data-testid': 'LanguageIcon' }, 'Language'),
  Public: () => createElement('span', { 'data-testid': 'PublicIcon' }, 'Public'),
  Lock: () => createElement('span', { 'data-testid': 'LockIcon' }, 'Lock'),
  LockOpen: () => createElement('span', { 'data-testid': 'LockOpenIcon' }, 'LockOpen'),
  VerifiedUser: () => createElement('span', { 'data-testid': 'VerifiedUserIcon' }, 'VerifiedUser'),
  Security: () => createElement('span', { 'data-testid': 'SecurityIcon' }, 'Security'),
  Help: () => createElement('span', { 'data-testid': 'HelpIcon' }, 'Help'),
  Feedback: () => createElement('span', { 'data-testid': 'FeedbackIcon' }, 'Feedback'),
  BugReport: () => createElement('span', { 'data-testid': 'BugReportIcon' }, 'BugReport'),
  Code: () => createElement('span', { 'data-testid': 'CodeIcon' }, 'Code'),
  Build: () => createElement('span', { 'data-testid': 'BuildIcon' }, 'Build'),
  Storage: () => createElement('span', { 'data-testid': 'StorageIcon' }, 'Storage'),
  Cloud: () => createElement('span', { 'data-testid': 'CloudIcon' }, 'Cloud'),
  CloudDownload: () =>
    createElement('span', { 'data-testid': 'CloudDownloadIcon' }, 'CloudDownload'),
  CloudSync: () => createElement('span', { 'data-testid': 'CloudSyncIcon' }, 'CloudSync'),
  CloudQueue: () => createElement('span', { 'data-testid': 'CloudQueueIcon' }, 'CloudQueue'),
  CloudOff: () => createElement('span', { 'data-testid': 'CloudOffIcon' }, 'CloudOff'),
  CloudDone: () => createElement('span', { 'data-testid': 'CloudDoneIcon' }, 'CloudDone'),
  CloudCircle: () => createElement('span', { 'data-testid': 'CloudCircleIcon' }, 'CloudCircle'),
  ArticleOutlined: () =>
    createElement('span', { 'data-testid': 'ArticleOutlinedIcon' }, 'ArticleOutlined'),
  AttachFile: () => createElement('span', { 'data-testid': 'AttachFileIcon' }, 'AttachFile'),
  ContactSupportOutlined: () =>
    createElement(
      'span',
      { 'data-testid': 'ContactSupportOutlinedIcon' },
      'ContactSupportOutlined'
    ),
  FeedbackOutlined: () =>
    createElement('span', { 'data-testid': 'FeedbackOutlinedIcon' }, 'FeedbackOutlined'),
  ForumOutlined: () =>
    createElement('span', { 'data-testid': 'ForumOutlinedIcon' }, 'ForumOutlined'),
  HelpOutlineOutlined: () =>
    createElement('span', { 'data-testid': 'HelpOutlineOutlinedIcon' }, 'HelpOutlineOutlined'),
  QuestionAnswerOutlined: () =>
    createElement(
      'span',
      { 'data-testid': 'QuestionAnswerOutlinedIcon' },
      'QuestionAnswerOutlined'
    ),
  RateReviewOutlined: () =>
    createElement('span', { 'data-testid': 'RateReviewOutlinedIcon' }, 'RateReviewOutlined'),
  SearchOutlined: () =>
    createElement('span', { 'data-testid': 'SearchOutlinedIcon' }, 'SearchOutlined'),
  SendOutlined: () => createElement('span', { 'data-testid': 'SendOutlinedIcon' }, 'SendOutlined'),
};

vi.mock('@mui/icons-material', () => mockIcons);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, to, ...props }: any) =>
      createElement('a', { href: to, ...props, 'data-testid': 'router-link' }, children),
    NavLink: ({ children, to, ...props }: any) =>
      createElement('a', { href: to, ...props, 'data-testid': 'nav-link' }, children),
    Outlet: () => createElement('div', { 'data-testid': 'outlet' }),
    Routes: ({ children }: any) => createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ children }: any) => createElement('div', { 'data-testid': 'route' }, children),
  };
});

// Mock browser APIs
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock fetch - let individual tests mock as needed
// global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn() as any;

// Mock window.scrollTo
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
  writable: true,
});

// Mock requestAnimationFrame
window.requestAnimationFrame = vi.fn();
window.cancelAnimationFrame = vi.fn();

// Mock console methods
console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn();

// Create a custom render function that includes all providers
const customRender = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    ),
    ...options,
  });
};

// Export custom render function
export { customRender as render };

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Start MSW server before all tests
beforeAll(() => {
  // Mock Material-UI icons
  vi.mock('@mui/icons-material', () => mockIcons);

  // Start MSW server
  server.listen();
});

// Export test utilities
export * from '@testing-library/react';
