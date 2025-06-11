import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React from 'react';

interface FileShareProps {
  open: boolean;
  onClose: () => void;
  onShare: (email: string) => void;
  fileName: string;
}

const FileShare: React.FC<FileShareProps> = ({ open, onClose, onShare, fileName }) => {
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShare(email);
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Share "{fileName}"</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Share
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FileShare;
