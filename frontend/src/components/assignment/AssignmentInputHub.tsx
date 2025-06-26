import { Chat as ChatIcon, Link as LinkIcon, Upload as UploadIcon } from '@mui/icons-material';
import { Alert, Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import { AIChatInterface } from '../ai/AIChatInterface';
import { FileUpload } from '../common/FileUpload';
import { LinkSubmissionForm } from '../input/LinkSubmissionForm';

interface AssignmentInputHubProps {
  onAssignmentGenerated?: (content: string, source: string) => void;
  onFilesUploaded?: (files: File[]) => void;
  onLinksSubmitted?: (links: any[]) => void;
  className?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assignment-input-tabpanel-${index}`}
      aria-labelledby={`assignment-input-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AssignmentInputHub: React.FC<AssignmentInputHubProps> = ({
  onAssignmentGenerated,
  onFilesUploaded,
  onLinksSubmitted,
  className,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleChatGenerated = (content: string) => {
    if (onAssignmentGenerated) {
      onAssignmentGenerated(content, 'chat');
    }
  };

  const handleFilesUploaded = (files: File[]) => {
    if (onFilesUploaded) {
      onFilesUploaded(files);
    }
  };

  const handleLinksSubmitted = (links: any[]) => {
    if (onLinksSubmitted) {
      onLinksSubmitted(links);
    }
  };

  const handleContentExtracted = (content: string, title: string) => {
    if (onAssignmentGenerated) {
      onAssignmentGenerated(content, `link: ${title}`);
    }
  };

  return (
    <Paper elevation={3} className={className} sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="assignment input methods"
          variant="fullWidth"
        >
          <Tab
            icon={<ChatIcon />}
            label="AI Chat"
            id="assignment-input-tab-0"
            aria-controls="assignment-input-tabpanel-0"
          />
          <Tab
            icon={<UploadIcon />}
            label="File Upload"
            id="assignment-input-tab-1"
            aria-controls="assignment-input-tabpanel-1"
          />
          <Tab
            icon={<LinkIcon />}
            label="Link Submission"
            id="assignment-input-tab-2"
            aria-controls="assignment-input-tabpanel-2"
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          AI Assignment Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Describe your assignment requirements in natural language and let AI help you create it
        </Typography>
        <AIChatInterface
          onAssignmentGenerated={handleChatGenerated}
          placeholder="e.g., 'Create a 5-page research paper on climate change for a college-level environmental science course'"
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          File Upload
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload existing assignment files in PDF, DOC, DOCX, or TXT format
        </Typography>
        <FileUpload
          onUpload={handleFilesUploaded}
          multiple={true}
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          maxSize={10 * 1024 * 1024} // 10MB
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Link Submission
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Submit Google Docs links, public URLs, or document links for processing
        </Typography>
        <LinkSubmissionForm
          onContentExtracted={handleContentExtracted}
          onLinksChanged={handleLinksSubmitted}
        />
      </TabPanel>
    </Paper>
  );
};
