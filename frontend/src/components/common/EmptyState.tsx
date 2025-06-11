import AddIcon from '@mui/icons-material/Add';
import InboxIcon from '@mui/icons-material/Inbox';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  margin: '1rem 0',
}));

const Icon = styled(Box)(({ theme }) => ({
  fontSize: '3rem',
  marginBottom: '1rem',
  color: theme.palette.text.secondary,
}));

const Title = styled(Typography)(({ theme }) => ({
  margin: '0 0 0.5rem 0',
  color: theme.palette.text.primary,
  fontSize: '1.25rem',
}));

const Message = styled(Typography)(({ theme }) => ({
  margin: 0,
  color: theme.palette.text.secondary,
  fontSize: '1rem',
  lineHeight: 1.5,
}));

interface EmptyStateProps {
  icon?: string;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  title?: string;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
  message?: string;
  messageClassName?: string;
  messageStyle?: React.CSSProperties;
  actionText?: string;
  actionIcon?: string;
  actionColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  actionVariant?: 'text' | 'outlined' | 'contained';
  actionSize?: 'small' | 'medium' | 'large';
  actionClassName?: string;
  actionStyle?: React.CSSProperties;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction?: () => void;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
  image?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}

function renderIconByName(name?: string, props: any = {}) {
  if (!name) return null;
  switch (name.toLowerCase()) {
    case 'inbox':
      return <InboxIcon data-testid="InboxIcon" {...props} />;
    case 'search':
      return <SearchIcon data-testid="SearchIcon" {...props} />;
    case 'add':
      return <AddIcon data-testid="AddIcon" {...props} />;
    default:
      return null;
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconClassName,
  iconStyle,
  title,
  titleClassName,
  titleStyle,
  message = 'There are no items to display',
  messageClassName,
  messageStyle,
  actionText = 'Action',
  actionIcon,
  actionColor = 'primary',
  actionVariant = 'contained',
  actionSize = 'medium',
  actionClassName,
  actionStyle,
  actionDisabled = false,
  actionLoading = false,
  onAction,
  containerClassName,
  containerStyle,
  role = 'region',
  tabIndex,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': dataTestId,
  image,
  imageAlt,
  children,
}) => {
  // If children are provided, render them only
  if (children) {
    return (
      <Container
        className={containerClassName}
        style={containerStyle}
        role={role}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        data-testid={dataTestId}
      >
        {children}
      </Container>
    );
  }

  // Always render the action button unless onAction is explicitly null
  const shouldRenderActionButton = onAction !== null;
  const noop = () => {};

  return (
    <Container
      className={containerClassName}
      style={containerStyle}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      data-testid={dataTestId}
    >
      {image ? (
        <img
          role="img"
          src={image}
          alt={imageAlt || title || ''}
          style={{ marginBottom: '1rem', maxWidth: '100%', height: 'auto' }}
        />
      ) : icon ? (
        <Icon className={iconClassName} style={iconStyle}>
          {renderIconByName(icon, { className: iconClassName, style: iconStyle })}
        </Icon>
      ) : null}
      {title && (
        <Title variant="h3" className={titleClassName} style={titleStyle}>
          {title}
        </Title>
      )}
      {message && (
        <Message className={messageClassName} style={messageStyle}>
          {message}
        </Message>
      )}
      {shouldRenderActionButton && (
        <Button
          variant={actionVariant}
          color={actionColor}
          size={actionSize}
          className={actionClassName}
          style={actionStyle}
          onClick={onAction || noop}
          disabled={actionDisabled}
          data-testid="action-button"
        >
          {actionLoading ? (
            <CircularProgress size={24} role="progressbar" />
          ) : (
            <React.Fragment>
              {actionIcon && renderIconByName(actionIcon)}
              {actionText}
            </React.Fragment>
          )}
        </Button>
      )}
    </Container>
  );
};

export default EmptyState;
