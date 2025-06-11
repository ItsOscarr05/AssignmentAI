import { Google as GoogleIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';

interface GoogleDocsIntegrationProps {
  open: boolean;
  onClose: () => void;
  onSelect: (file: { id: string; name: string; content: string }) => void;
}

export const GoogleDocsIntegration: React.FC<GoogleDocsIntegrationProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, signIn, signOut } = useGoogleAuth();
  const { listFiles, getFileContent } = useGoogleDrive();
  const [files, setFiles] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (open && isAuthenticated) {
      loadFiles();
    }
  }, [open, isAuthenticated]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError('Failed to load Google Docs files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (fileId: string, fileName: string) => {
    try {
      setLoading(true);
      setError(null);
      const content = await getFileContent(fileId);
      onSelect({ id: fileId, name: fileName, content });
      onClose();
    } catch (err) {
      setError('Failed to load file content');
      console.error('Error loading file content:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import from Google Docs</DialogTitle>
      <DialogContent>
        {!isAuthenticated ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" gutterBottom>
              Connect your Google account to access your documents
            </Typography>
            <Button variant="contained" startIcon={<GoogleIcon />} onClick={signIn} sx={{ mt: 2 }}>
              Connect Google Account
            </Button>
          </Box>
        ) : (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ py: 2 }}>
                {error}
              </Typography>
            ) : (
              <List>
                {files.map(file => (
                  <ListItem
                    key={file.id}
                    button
                    onClick={() => handleFileSelect(file.id, file.name)}
                  >
                    <ListItemIcon>
                      <GoogleIcon />
                    </ListItemIcon>
                    <ListItemText primary={file.name} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {isAuthenticated && (
          <Button onClick={signOut} color="secondary">
            Disconnect
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
