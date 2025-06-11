import {
  CreateNewFolder,
  Delete,
  Download,
  Folder,
  InsertDriveFile,
  Share,
  Upload,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { files as filesService } from '../../services/api';
import FileCreateFolder from './FileCreateFolder';
import FileShare from './FileShare';
import { FileUpload } from './FileUpload';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: string;
  updatedAt: string;
  path: string;
}

export const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [filesList, setFilesList] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await filesService.list(currentPath.join('/'));
      setFilesList(response);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath([...currentPath, file.name]);
      fetchFiles();
    } else {
      setSelectedFile(file);
    }
  };

  const handleBack = () => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      fetchFiles();
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

    try {
      await filesService.delete(file.path);
      await fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const blob = await filesService.download(file.path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="h5">File Manager</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" startIcon={<Upload />} onClick={() => setShowUpload(true)}>
              Upload
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<CreateNewFolder />}
              onClick={() => setShowCreateFolder(true)}
            >
              New Folder
            </Button>
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item>
              <Button onClick={handleBack} disabled={currentPath.length <= 1}>
                Back
              </Button>
            </Grid>
            <Grid item>
              <Typography variant="body1">{currentPath.join(' / ')}</Typography>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Grid container spacing={2}>
              {filesList.map(file => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    onClick={() => handleFileClick(file)}
                  >
                    <Grid container spacing={1} alignItems="center">
                      <Grid item>{file.type === 'folder' ? <Folder /> : <InsertDriveFile />}</Grid>
                      <Grid item xs>
                        <Typography noWrap>{file.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Folder'}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setShowShare(true);
                          }}
                        >
                          <Share fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>

      <FileUpload
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={() => {
          setShowUpload(false);
          fetchFiles();
        }}
        path={currentPath.join('/')}
      />

      <FileShare
        open={showShare}
        onClose={() => setShowShare(false)}
        onShare={() => {}}
        fileName={selectedFile?.name || ''}
      />

      <FileCreateFolder
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSubmit={() => {
          setShowCreateFolder(false);
          fetchFiles();
        }}
      />
    </Container>
  );
};
