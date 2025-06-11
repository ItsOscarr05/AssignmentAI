import { Close } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogProps,
  IconButton,
  Theme,
  Typography,
} from '@mui/material';
import { BackdropProps } from '@mui/material/Backdrop';
import React, { ReactNode } from 'react';

interface ExtendedBackdropProps extends BackdropProps {
  'data-testid'?: string;
}

interface DialogContainerProps extends Omit<DialogProps, 'open'> {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const DialogContainer: React.FC<DialogContainerProps> = ({
  children,
  title,
  subtitle,
  actions,
  maxWidth = 'sm',
  onClose,
  open = true,
  ...props
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      data-testid="dialog-container"
      PaperProps={{
        sx: {
          backgroundColor: (theme: Theme) => theme.palette.background.paper,
          borderRadius: (theme: Theme) => theme.shape.borderRadius,
          boxShadow: (theme: Theme) => theme.shadows[3],
          transition: (theme: Theme) =>
            theme.transitions.create('transform', {
              duration: theme.transitions.duration.standard,
            }),
          '@media (max-width: 600px)': {
            margin: (theme: Theme) => theme.spacing(2),
          },
        },
      }}
      BackdropProps={
        {
          'data-testid': 'dialog-backdrop',
          sx: {
            backgroundColor: (theme: Theme) =>
              `rgba(0, 0, 0, ${theme.palette.mode === 'dark' ? 0.7 : 0.5})`,
          },
        } as ExtendedBackdropProps
      }
      {...props}
    >
      {(title || subtitle || actions) && (
        <Box
          data-testid="dialog-header"
          sx={{
            padding: (theme: Theme) => theme.spacing(2),
            borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            {title && (
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  margin: 0,
                  color: (theme: Theme) => theme.palette.text.primary,
                  fontSize: (theme: Theme) => theme.typography.h6.fontSize,
                  fontWeight: (theme: Theme) => theme.typography.fontWeightBold,
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="subtitle1"
                sx={{
                  marginTop: (theme: Theme) => theme.spacing(1),
                  color: (theme: Theme) => theme.palette.text.secondary,
                  fontSize: (theme: Theme) => theme.typography.subtitle1.fontSize,
                  fontWeight: (theme: Theme) => theme.typography.fontWeightRegular,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {onClose && (
            <IconButton
              onClick={onClose}
              aria-label="close"
              sx={{
                color: (theme: Theme) => theme.palette.grey[500],
                padding: (theme: Theme) => theme.spacing(1),
              }}
            >
              <Close />
            </IconButton>
          )}
          {actions && <Box>{actions}</Box>}
        </Box>
      )}

      <DialogContent
        data-testid="dialog-content"
        sx={{
          padding: (theme: Theme) => theme.spacing(2),
          overflow: 'auto',
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default DialogContainer;
