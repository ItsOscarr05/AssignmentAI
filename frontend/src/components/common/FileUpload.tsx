import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import React, { useRef, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  error?: string;
  value?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  error,
  value,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    onFileSelect(file);
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileRemove?.();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon sx={{ fontSize: 40 }} />;
    }
    return <DescriptionIcon sx={{ fontSize: 40 }} />;
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: "none" }}
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Paper
          sx={{
            p: 3,
            textAlign: "center",
            border: "2px dashed",
            borderColor: dragActive ? "primary.main" : "grey.300",
            backgroundColor: dragActive ? "action.hover" : "background.paper",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1,
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop your file here
          </Typography>
          <Typography variant="body2" color="textSecondary">
            or click to select a file
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            display="block"
            sx={{ mt: 1 }}
          >
            Maximum file size: {maxSize / (1024 * 1024)}MB
          </Typography>
        </Paper>
      </label>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {value && (
        <Paper sx={{ p: 2, mt: 2, display: "flex", alignItems: "center" }}>
          {getFileIcon(value)}
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Typography variant="body1">{value.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              {(value.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
          <IconButton onClick={handleRemove} size="small">
            <CloseIcon />
          </IconButton>
        </Paper>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Uploading: {uploadProgress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};
