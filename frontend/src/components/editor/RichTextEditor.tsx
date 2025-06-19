import {
  Code,
  FormatAlignCenter,
  FormatAlignJustify,
  FormatAlignLeft,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  FormatStrikethrough,
  FormatUnderlined,
  Fullscreen,
  FullscreenExit,
  History,
  Image,
  Link,
  People,
  Preview,
  Redo,
  Save,
  TableChart,
  Undo,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  collaborative?: boolean;
  onSave?: () => void;
  className?: string;
}

interface Version {
  id: string;
  timestamp: Date;
  content: string;
  author: string;
  description: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
  lastSeen: Date;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  collaborative = false,
  onSave,
  className,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageDialog, setImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    if (collaborative) {
      setCollaborators([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          online: true,
          lastSeen: new Date(),
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          online: false,
          lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        },
      ]);
    }

    setVersions([
      {
        id: '1',
        timestamp: new Date(),
        content: value,
        author: 'Current User',
        description: 'Current version',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        content: 'Previous content...',
        author: 'John Doe',
        description: 'Added introduction',
      },
    ]);
  }, [collaborative, value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    enqueueSnackbar('Content saved successfully', { variant: 'success' });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
    setLinkDialog(true);
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      execCommand('createLink', linkUrl);
      setLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const img = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto;" />`;
      execCommand('insertHTML', img);
      setImageDialog(false);
      setImageUrl('');
      setImageAlt('');
    }
  };

  const insertTable = () => {
    const table = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 2</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 3</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 4</td>
        </tr>
      </table>
    `;
    execCommand('insertHTML', table);
  };

  const insertCode = () => {
    const code = `<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace;"><code>Your code here</code></pre>`;
    execCommand('insertHTML', code);
  };

  const restoreVersion = (version: Version) => {
    onChange(version.content);
    setShowVersions(false);
    enqueueSnackbar(`Restored version from ${version.timestamp.toLocaleString()}`, {
      variant: 'success',
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    execCommand('insertText', text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
      }
    }
  };

  return (
    <Paper
      elevation={2}
      className={className}
      sx={{
        height: isFullscreen ? '100vh' : 'auto',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
      }}
    >
      {/* Toolbar */}
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
        {/* Text Formatting */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton onClick={() => execCommand('bold')} size="small">
              <FormatBold />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton onClick={() => execCommand('italic')} size="small">
              <FormatItalic />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline (Ctrl+U)">
            <IconButton onClick={() => execCommand('underline')} size="small">
              <FormatUnderlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Strikethrough">
            <IconButton onClick={() => execCommand('strikeThrough')} size="small">
              <FormatStrikethrough />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Lists */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
          <Tooltip title="Bullet List">
            <IconButton onClick={() => execCommand('insertUnorderedList')} size="small">
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton onClick={() => execCommand('insertOrderedList')} size="small">
              <FormatListNumbered />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quote">
            <IconButton onClick={() => execCommand('formatBlock', '<blockquote>')} size="small">
              <FormatQuote />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Alignment */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
          <Tooltip title="Align Left">
            <IconButton onClick={() => execCommand('justifyLeft')} size="small">
              <FormatAlignLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Center">
            <IconButton onClick={() => execCommand('justifyCenter')} size="small">
              <FormatAlignCenter />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Right">
            <IconButton onClick={() => execCommand('justifyRight')} size="small">
              <FormatAlignRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Justify">
            <IconButton onClick={() => execCommand('justifyFull')} size="small">
              <FormatAlignJustify />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Insert Tools */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
          <Tooltip title="Insert Link">
            <IconButton onClick={handleLink} size="small">
              <Link />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Image">
            <IconButton onClick={() => setImageDialog(true)} size="small">
              <Image />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Table">
            <IconButton onClick={insertTable} size="small">
              <TableChart />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Code">
            <IconButton onClick={insertCode} size="small">
              <Code />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* History */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
          <Tooltip title="Undo (Ctrl+Z)">
            <IconButton onClick={() => execCommand('undo')} size="small">
              <Undo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <IconButton onClick={() => execCommand('redo')} size="small">
              <Redo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Version History">
            <IconButton onClick={() => setShowVersions(true)} size="small">
              <History />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Collaboration */}
        {collaborative && (
          <>
            <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
              <Tooltip title="Collaborators">
                <IconButton onClick={() => setShowCollaborators(true)} size="small">
                  <People />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider orientation="vertical" flexItem />
          </>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Tooltip title="Save (Ctrl+S)">
            <IconButton onClick={handleSave} size="small" color="primary">
              <Save />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview">
            <IconButton
              onClick={() => window.open('', '_blank')?.document.write(value)}
              size="small"
            >
              <Preview />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={handleFullscreen} size="small">
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Editor Content */}
      <Box
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={e => onChange(e.currentTarget.innerHTML)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value }}
        sx={{
          minHeight: '400px',
          padding: 2,
          outline: 'none',
          '&:focus': {
            backgroundColor: 'action.hover',
          },
          '&[contenteditable="true"]:empty:before': {
            content: `"${placeholder}"`,
            color: 'text.disabled',
            fontStyle: 'italic',
          },
        }}
      />

      {/* Collaboration Status */}
      {collaborative && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Collaborators:
            </Typography>
            {collaborators.map(collaborator => (
              <Chip
                key={collaborator.id}
                label={collaborator.name}
                size="small"
                color={collaborator.online ? 'success' : 'default'}
                variant={collaborator.online ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialog} onClose={() => setLinkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Link Text"
            value={linkText}
            onChange={e => setLinkText(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="URL"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            margin="normal"
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog(false)}>Cancel</Button>
          <Button onClick={insertLink} variant="contained">
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog} onClose={() => setImageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insert Image</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Image URL"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            margin="normal"
            placeholder="https://example.com/image.jpg"
          />
          <TextField
            fullWidth
            label="Alt Text"
            value={imageAlt}
            onChange={e => setImageAlt(e.target.value)}
            margin="normal"
            placeholder="Description of the image"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog(false)}>Cancel</Button>
          <Button onClick={insertImage} variant="contained">
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersions} onClose={() => setShowVersions(false)} maxWidth="md" fullWidth>
        <DialogTitle>Version History</DialogTitle>
        <DialogContent>
          <List>
            {versions.map(version => (
              <ListItem key={version.id} divider>
                <ListItemText
                  primary={version.description}
                  secondary={`${version.author} - ${version.timestamp.toLocaleString()}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => restoreVersion(version)}
                    disabled={version.id === '1'}
                  >
                    Restore
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersions(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Collaborators Dialog */}
      <Dialog
        open={showCollaborators}
        onClose={() => setShowCollaborators(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Collaborators</DialogTitle>
        <DialogContent>
          <List>
            {collaborators.map(collaborator => (
              <ListItem key={collaborator.id}>
                <ListItemText
                  primary={collaborator.name}
                  secondary={`${collaborator.email} - ${
                    collaborator.online
                      ? 'Online'
                      : `Last seen ${collaborator.lastSeen.toLocaleString()}`
                  }`}
                />
                <Chip
                  label={collaborator.online ? 'Online' : 'Offline'}
                  color={collaborator.online ? 'success' : 'default'}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCollaborators(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RichTextEditor;
