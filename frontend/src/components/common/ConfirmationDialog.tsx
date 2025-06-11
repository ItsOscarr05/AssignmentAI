import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  cancelColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  confirmVariant?: 'text' | 'outlined' | 'contained';
  cancelVariant?: 'text' | 'outlined' | 'contained';
  confirmSize?: 'small' | 'medium' | 'large';
  cancelSize?: 'small' | 'medium' | 'large';
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  confirmLoading?: boolean;
  cancelLoading?: boolean;
  showConfirm?: boolean;
  showCancel?: boolean;
  role?: 'dialog' | 'alertdialog';
  'aria-label'?: string;
  'aria-describedby'?: string;
  tabIndex?: number;
  'data-testid'?: string;
  actionsClassName?: string;
  actionsStyle?: React.CSSProperties;
  confirmClassName?: string;
  confirmStyle?: React.CSSProperties;
  cancelClassName?: string;
  cancelStyle?: React.CSSProperties;
  dialogClassName?: string;
  dialogStyle?: React.CSSProperties;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
  messageClassName?: string;
  messageStyle?: React.CSSProperties;
  confirmIcon?: string;
  cancelIcon?: string;
}

function renderIcon(iconName?: string) {
  if (!iconName) return null;
  switch (iconName.toLowerCase()) {
    case 'delete':
      return <DeleteIcon data-testid="DeleteIcon" sx={{ mr: 1 }} />;
    case 'arrow_back':
      return <ArrowBackIcon data-testid="ArrowBackIcon" sx={{ mr: 1 }} />;
    default:
      return null;
  }
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  cancelColor = 'primary',
  confirmVariant = 'text',
  cancelVariant = 'text',
  confirmSize = 'medium',
  cancelSize = 'medium',
  confirmDisabled = false,
  cancelDisabled = false,
  confirmLoading = false,
  cancelLoading = false,
  showConfirm = true,
  showCancel = true,
  role = 'dialog',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  tabIndex,
  'data-testid': dataTestId,
  actionsClassName,
  actionsStyle,
  confirmClassName,
  confirmStyle,
  cancelClassName,
  cancelStyle,
  dialogClassName,
  dialogStyle,
  titleClassName,
  titleStyle,
  messageClassName,
  messageStyle,
  confirmIcon,
  cancelIcon,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={tabIndex}
      data-testid={dataTestId}
      className={dialogClassName}
      style={dialogStyle}
      PaperProps={{
        className: dialogClassName,
        style: dialogStyle,
      }}
    >
      {title && (
        <DialogTitle className={titleClassName} style={titleStyle}>
          {title}
        </DialogTitle>
      )}
      {message && (
        <DialogContent>
          <DialogContentText className={messageClassName} style={messageStyle}>
            {message}
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions role="group" className={actionsClassName} style={actionsStyle}>
        {showCancel && (
          <Button
            onClick={onCancel}
            color={cancelColor}
            variant={cancelVariant}
            size={cancelSize}
            disabled={cancelDisabled}
            className={cancelClassName}
            style={cancelStyle}
          >
            {cancelLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                {renderIcon(cancelIcon)}
                {cancelText}
              </>
            )}
          </Button>
        )}
        {showConfirm && (
          <Button
            onClick={onConfirm}
            color={confirmColor}
            variant={confirmVariant}
            size={confirmSize}
            disabled={confirmDisabled}
            autoFocus
            className={confirmClassName}
            style={confirmStyle}
          >
            {confirmLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                {renderIcon(confirmIcon)}
                {confirmText}
              </>
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
