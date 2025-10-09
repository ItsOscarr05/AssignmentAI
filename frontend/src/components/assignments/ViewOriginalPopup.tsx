import { Launch as LaunchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface ViewOriginalPopupProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  fileContent: string | null;
  loading: boolean;
  itemType?: string;
  itemData?: any;
}

const ViewOriginalPopup: React.FC<ViewOriginalPopupProps> = ({
  open,
  onClose,
  fileName,
  fileContent,
  loading,
  itemType,
  itemData,
}) => {
  const theme = useTheme();

  // Get file extension for format detection
  const getFileExtension = (filename: string) => {
    // Handle workshop activities that might not have proper file extensions
    if (itemType === 'workshop_activity' && itemData?.type === 'file') {
      // Try to extract file extension from the content or metadata
      if (itemData?.content && typeof itemData.content === 'string') {
        // Look for common file patterns in the content
        if (itemData.content.includes('Product') && itemData.content.includes('Units')) {
          return 'xlsx'; // Likely an Excel file based on content
        }
      }
      return 'xlsx'; // Default to Excel for file processing activities
    }

    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Handle cases where filename doesn't have extension
    if (!extension && itemType === 'workshop_activity') {
      return 'xlsx'; // Default for workshop file activities
    }

    return extension;
  };

  // Parse Excel content into a grid format
  const parseExcelContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const rows = lines.map(line => {
      // Handle CSV-like data
      if (line.includes(',')) {
        return line.split(',').map(cell => cell.trim().replace(/"/g, ''));
      }
      // Handle tab-separated data
      if (line.includes('\t')) {
        return line.split('\t').map(cell => cell.trim());
      }
      // Single column
      return [line.trim()];
    });
    return rows;
  };

  // Generate column headers (A, B, C, D, etc.)
  const generateColumnHeaders = (numColumns: number) => {
    const headers = [];
    for (let i = 0; i < numColumns; i++) {
      headers.push(String.fromCharCode(65 + i)); // A, B, C, D, etc.
    }
    return headers;
  };

  // Format content based on file type
  const formatContent = (content: string, filename: string) => {
    const extension = getFileExtension(filename);

    switch (extension) {
      case 'xlsx':
      case 'xls':
        // For Excel files, return parsed data for grid display
        return parseExcelContent(content);
      case 'csv':
        // For CSV files, format with proper line breaks
        return formatCSVContent(content);
      case 'json':
        // For JSON files, try to pretty print
        return formatJSONContent(content);
      case 'txt':
      case 'md':
        // For text files, preserve formatting
        return content;
      default:
        // For other files, show as-is
        return content;
    }
  };

  const formatCSVContent = (content: string) => {
    // Format CSV with proper alignment
    const lines = content.split('\n');

    return lines
      .map(line => {
        const cells = line.split(',');
        // Pad cells to align columns
        const paddedCells = cells.map(
          cell => cell.padEnd(20) // Adjust padding as needed
        );
        return paddedCells.join(' ');
      })
      .join('\n');
  };

  const formatJSONContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  const getContentDisplay = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!fileContent) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {itemType === 'workshop_activity'
              ? 'Original file content not available for workshop activities. Try viewing the file upload directly.'
              : 'No content available'}
          </Typography>
        </Box>
      );
    }

    const extension = getFileExtension(fileName);
    const formattedContent = formatContent(fileContent, fileName);

    // Special handling for Excel files - render as spreadsheet grid
    if (extension === 'xlsx' || extension === 'xls') {
      const rows = formattedContent as string[][];
      const maxColumns = Math.max(...rows.map(row => row.length));
      const columnHeaders = generateColumnHeaders(maxColumns);

      return (
        <Box
          sx={{
            maxHeight: '60vh',
            overflow: 'auto',
            backgroundColor: theme.palette.background.default,
            border: '1px solid',
            borderColor: theme.palette.divider,
            borderRadius: 1,
            p: 2,
          }}
        >
          {/* File type indicator */}
          <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              File Type: {extension.toUpperCase()} | Format: Excel Spreadsheet
            </Typography>
          </Box>

          {/* Spreadsheet Grid */}
          <TableContainer sx={{ maxHeight: '50vh' }}>
            <Table size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <TableHead>
                <TableRow>
                  {/* Empty cell for row numbers */}
                  <TableCell
                    sx={{
                      backgroundColor: theme.palette.grey[200],
                      border: '1px solid',
                      borderColor: 'divider',
                      width: '40px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    #
                  </TableCell>
                  {/* Column headers (A, B, C, D, etc.) */}
                  {columnHeaders.map(header => (
                    <TableCell
                      key={header}
                      sx={{
                        backgroundColor: theme.palette.grey[200],
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        minWidth: '100px',
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {/* Row number */}
                    <TableCell
                      sx={{
                        backgroundColor: theme.palette.grey[100],
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      {rowIndex + 1}
                    </TableCell>
                    {/* Row data */}
                    {columnHeaders.map((_, colIndex) => (
                      <TableCell
                        key={colIndex}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        }}
                      >
                        {row[colIndex] || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // Default text display for other file types
    return (
      <Box
        sx={{
          maxHeight: '60vh',
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: 1,
          p: 2,
        }}
      >
        {/* File type indicator */}
        <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            File Type: {extension.toUpperCase()} | Format: {extension.toUpperCase()}
          </Typography>
        </Box>

        {/* Content display */}
        <Typography
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {formattedContent as string}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          border: '2px solid',
          borderColor: 'error.main',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LaunchIcon />
          Original File: {fileName}
        </Box>
      </DialogTitle>
      <DialogContent>{getContentDisplay()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewOriginalPopup;
