import Editor from '@monaco-editor/react';
import { Settings as SettingsIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../services/api';

interface FileCompletionProps {
  filePath: string;
  initialContent?: string;
  language?: string;
  onSave?: (content: string) => void;
}

const FileCompletion: React.FC<FileCompletionProps> = ({
  filePath,
  initialContent = '',
  language,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [, setEditorInstance] = useState<any>(null);

  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    if (onSave) {
      onSave(debouncedContent);
    }
  }, [debouncedContent, onSave]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);

    // Configure editor settings
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      cursorStyle: 'line',
      automaticLayout: true,
      contextmenu: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      wordBasedSuggestions: true,
    });

    // Add key event listener
    editor.onKeyDown((event: any) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
      }
    });

    // Add custom completion provider
    monaco.languages.registerCompletionItemProvider(language || 'plaintext', {
      triggerCharacters: ['.', ':', '@', '"', "'", '`', '/', '\\'],
      provideCompletionItems: async (model: any, position: any) => {
        try {
          setIsLoading(true);
          setError(null);

          const response = await api.post('/completion', {
            file_path: filePath,
            cursor_position: model.getOffsetAt(position),
            file_content: model.getValue(),
            language,
          });

          if (response.data.error) {
            setError(response.data.error);
            return { suggestions: [] };
          }

          const { completion, confidence } = response.data;
          setShowCompletion(true);

          return {
            suggestions: [
              {
                label: completion,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: completion,
                detail: `Confidence: ${(confidence * 100).toFixed(1)}%`,
                documentation: {
                  value: '```' + (language || 'plaintext') + '\n' + completion + '\n```',
                  isTrusted: true,
                },
              },
            ],
          };
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to get completion');
          return { suggestions: [] };
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          {filePath}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isLoading && <CircularProgress size={20} />}
          <Tooltip title="Settings">
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
          defaultLanguage={language || 'plaintext'}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            contextmenu: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: true,
          }}
        />
      </Box>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showCompletion}
        autoHideDuration={3000}
        onClose={() => setShowCompletion(false)}
      >
        <Alert onClose={() => setShowCompletion(false)} severity="info" sx={{ width: '100%' }}>
          Press Ctrl+Enter to trigger completion
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default FileCompletion;
