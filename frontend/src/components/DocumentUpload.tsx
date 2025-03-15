import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { useApi } from "../hooks/useApi";

interface DocumentUploadProps {
  assignmentId?: number;
  onDocumentProcessed?: (documentId: number) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  assignmentId,
  onDocumentProcessed,
}) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const response = await api.post("/api/documents/", {
        url,
        assignment_id: assignmentId,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setUrl("");
      if (onDocumentProcessed) {
        onDocumentProcessed(response.id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process document"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Add External Document
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Document URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste document link here"
        disabled={isProcessing}
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={!url || isProcessing}
        sx={{ mb: 2 }}
      >
        {isProcessing ? "Processing..." : "Add Document"}
      </Button>
    </Box>
  );
};
