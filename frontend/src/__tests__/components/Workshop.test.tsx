import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import Workshop from '../../pages/Workshop';
import { useWorkshopStore } from '../../services/WorkshopService';
import { theme } from '../../theme';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    TextField: ({ label, name, type, value, onChange, required, placeholder }: any) => (
      <div>
        <label htmlFor={name}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <input
          id={name}
          name={name}
          type={type || 'text'}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
        />
      </div>
    ),
    Alert: ({ children, severity }: { children: React.ReactNode; severity: string }) => (
      <div role="alert" data-severity={severity}>
        {children}
      </div>
    ),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock @mui/icons-material
vi.mock('@mui/icons-material', () => {
  const createIconMock = (name: string) => {
    return () => <span data-testid={`${name.toLowerCase()}-icon`}>{name}</span>;
  };

  return {
    Upload: createIconMock('Upload'),
    Link: createIconMock('Link'),
    Send: createIconMock('Send'),
    History: createIconMock('History'),
    Lightbulb: createIconMock('Lightbulb'),
    Description: createIconMock('Description'),
    Assessment: createIconMock('Assessment'),
    Analytics: createIconMock('Analytics'),
    Speed: createIconMock('Speed'),
    CloudUpload: createIconMock('CloudUpload'),
    InfoOutlined: createIconMock('InfoOutlined'),
    BarChartOutlined: createIconMock('BarChartOutlined'),
    Add: createIconMock('Add'),
    Delete: createIconMock('Delete'),
    DeleteOutlined: createIconMock('DeleteOutlined'),
    Edit: createIconMock('Edit'),
    EditOutlined: createIconMock('EditOutlined'),
    Search: createIconMock('Search'),
    Filter: createIconMock('Filter'),
    Sort: createIconMock('Sort'),
    Refresh: createIconMock('Refresh'),
    Download: createIconMock('Download'),
    DownloadOutlined: createIconMock('DownloadOutlined'),
    Print: createIconMock('Print'),
    Share: createIconMock('Share'),
    Favorite: createIconMock('Favorite'),
    Star: createIconMock('Star'),
    ThumbUp: createIconMock('ThumbUp'),
    ThumbDown: createIconMock('ThumbDown'),
    Comment: createIconMock('Comment'),
    Reply: createIconMock('Reply'),
    Forward: createIconMock('Forward'),
    Back: createIconMock('Back'),
    Next: createIconMock('Next'),
    FirstPage: createIconMock('FirstPage'),
    LastPage: createIconMock('LastPage'),
    ChevronLeft: createIconMock('ChevronLeft'),
    ChevronRight: createIconMock('ChevronRight'),
    ExpandMore: createIconMock('ExpandMore'),
    ExpandLess: createIconMock('ExpandLess'),
    Menu: createIconMock('Menu'),
    Close: createIconMock('Close'),
    Check: createIconMock('Check'),
    Cancel: createIconMock('Cancel'),
    Warning: createIconMock('Warning'),
    Error: createIconMock('Error'),
    Success: createIconMock('Success'),
    Info: createIconMock('Info'),
    Help: createIconMock('Help'),
    Settings: createIconMock('Settings'),
    AccountCircle: createIconMock('AccountCircle'),
    Person: createIconMock('Person'),
    Group: createIconMock('Group'),
    Business: createIconMock('Business'),
    School: createIconMock('School'),
    Work: createIconMock('Work'),
    Home: createIconMock('Home'),
    LocationOn: createIconMock('LocationOn'),
    Phone: createIconMock('Phone'),
    Email: createIconMock('Email'),
    Web: createIconMock('Web'),
    Language: createIconMock('Language'),
    AccessTime: createIconMock('AccessTime'),
    CalendarToday: createIconMock('CalendarToday'),
    DateRange: createIconMock('DateRange'),
    Schedule: createIconMock('Schedule'),
    Timer: createIconMock('Timer'),
    Alarm: createIconMock('Alarm'),
    Notifications: createIconMock('Notifications'),
    NotificationsActive: createIconMock('NotificationsActive'),
    NotificationsNone: createIconMock('NotificationsNone'),
    Visibility: createIconMock('Visibility'),
    VisibilityOff: createIconMock('VisibilityOff'),
    Lock: createIconMock('Lock'),
    LockOpen: createIconMock('LockOpen'),
    Security: createIconMock('Security'),
    VpnKey: createIconMock('VpnKey'),
    Fingerprint: createIconMock('Fingerprint'),
    Face: createIconMock('Face'),
    Verified: createIconMock('Verified'),
    GppGood: createIconMock('GppGood'),
    GppBad: createIconMock('GppBad'),
    Shield: createIconMock('Shield'),
    ShieldCheck: createIconMock('ShieldCheck'),
    ShieldWarning: createIconMock('ShieldWarning'),
    ShieldError: createIconMock('ShieldError'),
    ShieldInfo: createIconMock('ShieldInfo'),
    Dashboard: createIconMock('Dashboard'),
    ViewDashboard: createIconMock('ViewDashboard'),
    ViewModule: createIconMock('ViewModule'),
    ViewList: createIconMock('ViewList'),
    ViewStream: createIconMock('ViewStream'),
    ViewQuilt: createIconMock('ViewQuilt'),
    ViewWeek: createIconMock('ViewWeek'),
    ViewDay: createIconMock('ViewDay'),
    ViewAgenda: createIconMock('ViewAgenda'),
    ViewCarousel: createIconMock('ViewCarousel'),
    ViewComfy: createIconMock('ViewComfy'),
    ViewCompact: createIconMock('ViewCompact'),
    ViewHeadline: createIconMock('ViewHeadline'),
    ViewColumn: createIconMock('ViewColumn'),
    ViewArray: createIconMock('ViewArray'),
    ViewTimeline: createIconMock('ViewTimeline'),
    ViewKanban: createIconMock('ViewKanban'),
    ViewSidebar: createIconMock('ViewSidebar'),
    // Workshop-specific icons
    Chat: createIconMock('Chat'),
    ChatOutlined: createIconMock('ChatOutlined'),
    ContentCopy: createIconMock('ContentCopy'),
    HistoryOutlined: createIconMock('HistoryOutlined'),
    LinkOutlined: createIconMock('LinkOutlined'),
    PushPin: createIconMock('PushPin'),
    PushPinOutlined: createIconMock('PushPinOutlined'),
    UploadOutlined: createIconMock('UploadOutlined'),
    FormatListBulleted: createIconMock('FormatListBulleted'),
    RecordVoiceOverOutlined: createIconMock('RecordVoiceOverOutlined'),
  };
});

vi.mock('../../services/WorkshopService', () => ({
  useWorkshopStore: vi.fn(),
}));

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

describe('Workshop Component', () => {
  const mockGenerateContent = vi.fn();
  const mockAddFile = vi.fn();
  const mockAddLink = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkshopStore as any).mockReturnValue({
      generateContent: mockGenerateContent,
      addFile: mockAddFile,
      addLink: mockAddLink,
      history: [],
      files: [],
      error: null,
      isLoading: false,
    });
  });

  it('renders workshop interface', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('AI Workshop')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useWorkshopStore as any).mockReturnValue({
      generateContent: mockGenerateContent,
      addFile: mockAddFile,
      addLink: mockAddLink,
      history: [],
      files: [],
      error: null,
      isLoading: true,
    });

    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to process request';
    (useWorkshopStore as any).mockReturnValue({
      generateContent: mockGenerateContent,
      addFile: mockAddFile,
      addLink: mockAddLink,
      history: [],
      files: [],
      error: errorMessage,
      isLoading: false,
    });

    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles content generation', async () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    const input = screen.getByPlaceholderText('Type your assignment or question here...');
    const submitButton = screen.getByRole('button', { name: /^send send$/i });

    fireEvent.change(input, { target: { value: 'Test content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalledWith('Test content');
    });
  });

  it('handles file upload', async () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    // Switch to files tab
    fireEvent.click(screen.getByText('Files'));

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Upload Files');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockAddFile).toHaveBeenCalledWith(file);
    });
  });

  it('handles link addition', async () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    // Switch to links tab
    fireEvent.click(screen.getByText('Links'));

    const urlInput = screen.getByPlaceholderText('Enter URL...');

    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    // Submit the form
    const form = urlInput.closest('form');
    if (!form) throw new Error('Form not found');

    fireEvent.submit(form, {
      target: {
        url: { value: 'https://example.com' },
      },
    });

    await waitFor(() => {
      expect(mockAddLink).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'https://example.com',
        description: 'Link to https://example.com',
      });
    });
  });

  it('displays recent history', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Recent History')).toBeInTheDocument();
    expect(screen.getByText('Math Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('History Essay Outline')).toBeInTheDocument();
    expect(screen.getByText('Science Project Research')).toBeInTheDocument();
  });

  it('displays AI suggestions', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Start with an outline')).toBeInTheDocument();
    expect(screen.getByText('Use examples')).toBeInTheDocument();
  });

  it('displays supported file types', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Supported File Types')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
    expect(screen.getByText('TXT')).toBeInTheDocument();
    expect(screen.getByText('RTF')).toBeInTheDocument();
  });

  it('displays document stats', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Document Stats')).toBeInTheDocument();
    expect(screen.getByText('Word Count')).toBeInTheDocument();
    expect(screen.getByText('Reading Time')).toBeInTheDocument();
    expect(screen.getByText('Complexity')).toBeInTheDocument();
  });

  it('displays AI analysis options', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('AI Analysis Options')).toBeInTheDocument();
    expect(screen.getByText('Grammar & Style')).toBeInTheDocument();
    expect(screen.getByText('Content Analysis')).toBeInTheDocument();
    expect(screen.getByText('Plagiarism Check')).toBeInTheDocument();
  });

  it('displays quick actions', () => {
    render(
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Workshop />
        </ThemeProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Rewrite')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.getByText('Simplify')).toBeInTheDocument();
  });
});
