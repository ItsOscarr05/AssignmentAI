import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Collapse,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useApi } from "../hooks/useApi";

interface Document {
  id: number;
  url: string;
  title: string;
  content_type: string;
  processed: boolean;
  error: string | null;
}

interface DocumentListProps {
  assignmentId?: number;
  onDocumentSelect?: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  assignmentId,
  onDocumentSelect,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const api = useApi();

  const fetchDocuments = async () => {
    try {
      const url =
        "/api/documents/" +
        (assignmentId ? `?assignment_id=${assignmentId}` : "");
      const response = await api.get(url);
      setDocuments(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch documents"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [assignmentId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (documents.length === 0) {
    return (
      <Typography color="textSecondary">No documents added yet</Typography>
    );
  }

  return (
    <List>
      {documents.map((doc) => (
        <Paper key={doc.id} sx={{ mb: 1 }}>
          <ListItem
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() =>
                  setExpandedId(expandedId === doc.id ? null : doc.id)
                }
              >
                {expandedId === doc.id ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </IconButton>
            }
            onClick={() => onDocumentSelect && onDocumentSelect(doc)}
          >
            <ListItemText
              primary={doc.title}
              secondary={`Type: ${doc.content_type}`}
            />
          </ListItem>
          <Collapse in={expandedId === doc.id}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="textSecondary">
                URL: {doc.url}
              </Typography>
              {doc.error && (
                <Typography variant="body2" color="error">
                  Error: {doc.error}
                </Typography>
              )}
            </Box>
          </Collapse>
        </Paper>
      ))}
    </List>
  );
};
